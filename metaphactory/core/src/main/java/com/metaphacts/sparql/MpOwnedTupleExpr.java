/*
 * Copyright (C) 2015-2017, metaphacts GmbH
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, you can receive a copy
 * of the GNU Lesser General Public License from http://www.gnu.org/
 */

package com.metaphacts.sparql;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.eclipse.rdf4j.common.iteration.CloseableIteration;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.query.Binding;
import org.eclipse.rdf4j.query.BindingSet;
import org.eclipse.rdf4j.query.Dataset;
import org.eclipse.rdf4j.query.MalformedQueryException;
import org.eclipse.rdf4j.query.QueryEvaluationException;
import org.eclipse.rdf4j.query.QueryLanguage;
import org.eclipse.rdf4j.query.TupleQuery;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.query.algebra.BindingSetAssignment;
import org.eclipse.rdf4j.query.algebra.QueryModelVisitor;
import org.eclipse.rdf4j.query.algebra.TupleExpr;
import org.eclipse.rdf4j.query.algebra.UnaryTupleOperator;
import org.eclipse.rdf4j.query.impl.MapBindingSet;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.RepositoryException;
import org.eclipse.rdf4j.sail.federation.algebra.OwnedTupleExpr;
import org.eclipse.rdf4j.sail.federation.evaluation.InsertBindingSetCursor;

import com.google.common.collect.Sets;
import com.metaphacts.repository.federation.evaluation.MergeByIndexInsertBindingSetCursor;
import com.metaphacts.sparql.renderer.MpSparqlQueryRenderer;

import com.google.common.collect.Lists;

/**
 * Extended implementation of {@link OwnedTupleExpr}. 
 * Replaced instead of inheritance to avoid extensive use of reflection to 
 * access private fields and methods.
 * 
 * @author Andriy Nikolov <an@metaphacts.com>
 *
 */
public class MpOwnedTupleExpr extends UnaryTupleOperator {

    private static final long serialVersionUID = -1468326862584990755L;

    private final RepositoryConnection owner;

    private TupleQuery preparedQuery;
    
    private String queryAsString;

    private Map<String, String> variables;
    
    private ValueFactory vf;

    public RepositoryConnection getOwner() {
        return owner;
    }

    public MpOwnedTupleExpr(RepositoryConnection owner, TupleExpr arg) {
        super(arg);
        this.owner = owner;
        this.vf = owner.getValueFactory();
    }

    public void prepare(QueryLanguage queryLn, String qry, Map<String, String> bindings)
            throws RepositoryException, MalformedQueryException {
        assert this.preparedQuery == null;
        this.preparedQuery = owner.prepareTupleQuery(queryLn, qry);
        this.queryAsString = qry;
        this.variables = bindings;
    }

    public boolean hasQuery() {
        return preparedQuery != null;
    }

    public CloseableIteration<BindingSet, QueryEvaluationException> evaluate(Dataset dataset,
            BindingSet bindings) throws QueryEvaluationException {
        CloseableIteration<BindingSet, QueryEvaluationException> rval = null;
        if (preparedQuery != null) {
            try {
                synchronized (preparedQuery) {
                    for (String name : variables.keySet()) {
                        if (bindings.hasBinding(name)) {
                            Value value = bindings.getValue(name);
                            preparedQuery.setBinding(variables.get(name), value);
                        } else {
                            preparedQuery.removeBinding(variables.get(name));
                        }
                    }
                    preparedQuery.setDataset(dataset);
                    TupleQueryResult result = preparedQuery.evaluate();
                    rval = new InsertBindingSetCursor(result, bindings);
                }
            } catch (IllegalArgumentException e) { // NOPMD
                // query does not support BNode bindings
            }
        }
        return rval;
    }
    
    public CloseableIteration<BindingSet, QueryEvaluationException> evaluate(Dataset dataset,
            List<BindingSet> bindings, Set<String> boundVars) throws QueryEvaluationException {
        CloseableIteration<BindingSet, QueryEvaluationException> rval = null;
        if (queryAsString != null) {
            try {
                StringBuilder queryWithValues = new StringBuilder(queryAsString.replace("SELECT ", "SELECT ?__index "));
                if (!variables.isEmpty()) {
                    Set<String> toBind = Sets.newHashSet(variables.keySet());
                    toBind.retainAll(boundVars);
                    BindingSetAssignment bsAssignment = new BindingSetAssignment();
                    bsAssignment.setBindingNames(toBind);
                    List<BindingSet> newBindingSets = Lists.newArrayListWithCapacity(bindings.size());
                    for(int i=0; i<bindings.size();i++) {
                        BindingSet bs = bindings.get(i);
                        MapBindingSet newBs = new MapBindingSet();
                        bs.forEach(binding -> newBs.addBinding(binding.getName(), binding.getValue()));
                        newBs.addBinding("__index", vf.createLiteral(i));
                        newBindingSets.add(newBs);
                    }
                    bsAssignment.setBindingSets(newBindingSets);
                    
                    queryWithValues.append(renderValuesClause(bsAssignment));
                    
                    System.out.println(queryWithValues);
                    
                    TupleQuery tq = owner.prepareTupleQuery(queryWithValues.toString());
                    
                    tq.setDataset(dataset);
                    TupleQueryResult result = tq.evaluate();
                    
                    rval = new MergeByIndexInsertBindingSetCursor(result, bindings);
                } else { 
                    throw new UnsupportedOperationException("TODO: no bindings required (check query only)");
                } 
            } catch (Exception e) { 
               throw new QueryEvaluationException(e);
            }
        }
        return rval;
    }

    public <X extends Exception> void visit(QueryModelVisitor<X> visitor) throws X {
        visitor.meetOther(this);
    }

    @Override
    public String getSignature() {
        return this.getClass().getSimpleName() + " " + owner.toString();
    }
    
    protected String renderValuesClause(BindingSetAssignment node) throws RuntimeException {

        StringBuilder builder = new StringBuilder();
        MpSparqlQueryRenderer renderer = new MpSparqlQueryRenderer();
        
        List<String> bindingNames = new ArrayList<String>(node.getBindingNames());

        builder.append("VALUES (");
        for (String var : bindingNames) {
            builder.append("?");
            builder.append(var);
            builder.append(" ");
        }

        builder.append(") { ");
        for (BindingSet bs : node.getBindingSets()) {
            builder.append("(");
            for (String s : bindingNames) {
                if (bs.getValue(s) != null) {
                    builder.append(renderer.renderValue(bs.getValue(s)));
                } else {
                    builder.append("UNDEF ");
                }
            }
            builder.append(") ");
        }
        builder.append(" } ");
        
        return builder.toString();
    }

}