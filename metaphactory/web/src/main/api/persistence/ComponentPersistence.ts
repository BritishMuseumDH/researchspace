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

import { Rdf } from 'platform/api/rdf';
import { rdf, rdfs } from 'platform/api/rdf/vocabularies/vocabularies';
import { jsObjectToGraph, graphToJsObject } from 'platform/api/rdf/formats/JsObjectGraph';


const PERSISTED_COMPONENT = Rdf.iri('http://www.metaphacts.com/ontology/PersistedComponent');
const COMPONENT_TYPE = Rdf.iri('http://www.metaphacts.com/ontology/componentType');
const COMPONENT_PROPS = Rdf.iri('http://www.metaphacts.com/ontology/componentProps');
const COMPONENT_TYPE_IRI_PREFIX = 'http://www.metaphacts.com/ontology/components/';


export function componentToGraph(component, label?: string, description?: string): Rdf.Graph {
  const componentRoot = Rdf.iri('');
  const componentTypeIriString = COMPONENT_TYPE_IRI_PREFIX + component.type.__htmlTag;
  const propsPointedGraph = jsObjectToGraph(component.props, componentTypeIriString);
  let result = propsPointedGraph.graph.triples.toArray();
  result.push(
    Rdf.triple(componentRoot, rdf.type, PERSISTED_COMPONENT),
    Rdf.triple(componentRoot, COMPONENT_TYPE, Rdf.iri(componentTypeIriString)),
    Rdf.triple(componentRoot, COMPONENT_PROPS, propsPointedGraph.pointer),
  );
  if (label) {
    result.push(Rdf.triple(componentRoot, rdfs.label, Rdf.literal(label)));
  }
  if (description) {
    result.push(Rdf.triple(componentRoot, rdfs.comment, Rdf.literal(description)));
  }
  return Rdf.graph(result);
}


export function graphToComponent(graph: Rdf.Graph) {
  const root = graph.triples.filter(t =>
    t.p.equals(rdf.type) && t.o.equals(PERSISTED_COMPONENT)
  ).first().s;
  const componentType = graph.triples.filter(t =>
    t.s.equals(root) && t.p.equals(COMPONENT_TYPE)
  ).first().o.value;
  const componentProps = graph.triples.filter(t =>
    t.s.equals(root) && t.p.equals(COMPONENT_PROPS)
  ).first().o;
  return {
    componentType: componentType.substr(COMPONENT_TYPE_IRI_PREFIX.length),
    componentProps: graphToJsObject(componentProps, graph),
  };
}
