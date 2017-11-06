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

import * as _ from 'lodash';

import { Rdf } from 'platform/api/rdf';
import { rdf, xsd } from 'platform/api/rdf/vocabularies/vocabularies';


const PROP_IRI_STRING = 'http://www.metaphacts.com/ontology/json/key';
export const JSON_NULL_IRI = Rdf.iri('http://www.metaphacts.com/ontology/json/null');
export const JSON_UNDEFINED_IRI = Rdf.iri('http://www.metaphacts.com/ontology/json/undefined');

export function propKeyToUriDefault(key: string, baseIri: string = PROP_IRI_STRING): Rdf.Iri {
  if (key.includes('/')) {
    throw 'JSON key should not include "/" char';
  }
  return Rdf.iri(baseIri + '/' + key);
}

export function uriToPropKeyDefault(uri: Rdf.Iri): string {
  return uri.value.substr(uri.value.lastIndexOf('/') + 1);
}


/**
 * Converts JSON-like Javascript object into Rdf.PointedGraph similar to AST of JSON
 *
 * Arrays are represented as rdf:List
 *   [] -> rdf:nil
 *   [x:xs] -> root rdf:first x ; rdf:rest xs .
 * Objects are represented by list of predicates < prefix baseIri / path from root / key name >
 *   {"k": x} -> root <http://www.metaphacts.com/ontology/json/key/k> x .
 *   [{"k": x}] -> root rdf:first [ <http://www.metaphacts.com/ontology/json/key/_item/k> x ] .
 * Strings, booleans are represented by corresponding xsd literals, numbers by xsd:double or xsd:integer
 * Null value is represented by JSON_NULL_IRI
 */
export function jsObjectToGraph(
  value: any,
  baseIri = PROP_IRI_STRING,
  propKeyToUri: (key: string, baseIri: string) => Rdf.Iri = propKeyToUriDefault
): Rdf.PointedGraph {
  if (_.isUndefined(value)) {
    return Rdf.pg(JSON_UNDEFINED_IRI, Rdf.EMPTY_GRAPH);
  } else if (_.isNull(value)) {
    return Rdf.pg(JSON_NULL_IRI, Rdf.EMPTY_GRAPH);
  } else if (value.constructor === String) {
    return Rdf.pg(Rdf.literal(value, xsd._string), Rdf.EMPTY_GRAPH);
  } else if (value.constructor === Boolean) {
    return Rdf.pg(Rdf.literal(value, xsd.boolean), Rdf.EMPTY_GRAPH);
  } else if (value.constructor === Number) {
    if (Math.round(value) === value) {
      return Rdf.pg(Rdf.literal(value, xsd.integer), Rdf.EMPTY_GRAPH);
    } else {
      return Rdf.pg(Rdf.literal(value, xsd.double), Rdf.EMPTY_GRAPH);
    }
  } else if (value.constructor === Array) {
    if (value.length === 0) {
      return Rdf.pg(rdf.nil, Rdf.EMPTY_GRAPH);
    } else {
      const root = Rdf.bnode();
      const valuePointedGraph = jsObjectToGraph(value[0], baseIri + '/_item', propKeyToUri);
      const restPointedGraph = jsObjectToGraph(value.slice(1), baseIri, propKeyToUri);
      let triples = [];
      triples.push(...valuePointedGraph.graph.triples.toArray());
      triples.push(...restPointedGraph.graph.triples.toArray());
      triples.push(Rdf.triple(root, rdf.first, valuePointedGraph.pointer));
      triples.push(Rdf.triple(root, rdf.rest, restPointedGraph.pointer));
      return Rdf.pg(root, Rdf.graph(triples));
    }
  } else if (_.isPlainObject(value)) {
    const root = Rdf.bnode();
    let result = [];
    for (const key in value) {
      if (value.hasOwnProperty(key)) {
        const valuePointedGraph = jsObjectToGraph(value[key], baseIri + '/' + key, propKeyToUri);
        result.push(...valuePointedGraph.graph.triples.toArray());
        result.push(Rdf.triple(root, propKeyToUri(key, baseIri), valuePointedGraph.pointer));
      }
    }
    return Rdf.pg(root, Rdf.graph(result));
  }
  return Rdf.pg(JSON_NULL_IRI, Rdf.EMPTY_GRAPH); // unknown type
}


function graphToJsObjectHelper(
  root: Rdf.Node, graph: Rdf.Graph, uriToPropKey: (uri: Rdf.Iri) => string
) {
  const outgoing = graph.triples.filter(t => t.s.equals(root));
  if (!outgoing.filter(t => t.p.equals(rdf.first)).isEmpty()) {
    const firstTriples = graph.triples.filter(t => t.s.equals(root) && t.p.equals(rdf.first));
    const restTriples = graph.triples.filter(t => t.s.equals(root) && t.p.equals(rdf.rest));
    const first = graphToJsObject(firstTriples.first().o, graph, uriToPropKey);
    const rest = restTriples.isEmpty() ? [] : graphToJsObject(restTriples.first().o, graph, uriToPropKey);
    return [first].concat(rest);
  } else {
    let result = {};
    outgoing.forEach(t => {
      const key = uriToPropKey(t.p);
      if (key) {
        result[key] = graphToJsObject(t.o, graph, uriToPropKey);
      }
    });
    return result;
  }
}

/**
 * Converts Rdf.PointedGraph, generated by jsObjectToGraph, back to JSON-like object
 */
export function graphToJsObject(
  root: Rdf.Node, graph: Rdf.Graph, uriToPropKey: (uri: Rdf.Iri) => string = uriToPropKeyDefault
) {
  return root.cata<any>(
    iri => {
      if (iri.equals(rdf.nil)) {
        return [];
      } else if (iri.equals(JSON_UNDEFINED_IRI)) {
        return undefined;
      } else if (iri.equals(JSON_NULL_IRI)) {
        return null;
      } else {
        return graphToJsObjectHelper(iri, graph, uriToPropKey);
      }
    },
    literal => {
      if (literal.dataType.equals(xsd._string)) {
        return literal.value;
      } else if (literal.dataType.equals(xsd.boolean)) {
        return literal.value === 'true';
      } else if (literal.dataType.equals(xsd.double)) {
        return parseFloat(literal.value);
      } else if (literal.dataType.equals(xsd.integer)) {
        return parseInt(literal.value);
      }
    },
    bnode => {
      return graphToJsObjectHelper(bnode, graph, uriToPropKey);
    }
  );
}

