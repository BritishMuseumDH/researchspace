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

import { expect, assert } from 'chai';

import { Rdf, turtle } from 'platform/api/rdf';
import { xsd, rdf } from 'platform/api/rdf/vocabularies/vocabularies';
import { jsObjectToGraph, graphToJsObject, propKeyToUriDefault } from 'platform/api/rdf/formats/JsObjectGraph';

const exampleJs = [{
  abc: [123, 3.14, 'str'],
  def: 'abc',
}, {
  '123': [3.14, {}],
  def: true,
}];

const exampleGraph = Rdf.graph([
  Rdf.triple(Rdf.iri('http://root.org'), rdf.first, Rdf.bnode('0')),
  Rdf.triple(Rdf.iri('http://root.org'), rdf.rest, Rdf.bnode('0rest')),
  Rdf.triple(Rdf.bnode('0rest'), rdf.first, Rdf.bnode('1')),
  Rdf.triple(Rdf.bnode('0rest'), rdf.rest, rdf.nil),

  Rdf.triple(Rdf.bnode('0'), propKeyToUriDefault('abc'), Rdf.bnode('0_abc')),
  Rdf.triple(Rdf.bnode('0'), propKeyToUriDefault('def'), Rdf.literal('abc')),
  Rdf.triple(Rdf.bnode('1'), propKeyToUriDefault('123'), Rdf.bnode('1_123')),
  Rdf.triple(Rdf.bnode('1'), propKeyToUriDefault('def'), Rdf.literal(true)),

  Rdf.triple(Rdf.bnode('0_abc'), rdf.first, Rdf.literal('123', xsd.integer)),
  Rdf.triple(Rdf.bnode('0_abc'), rdf.rest, Rdf.bnode('0_abc_0rest')),
  Rdf.triple(Rdf.bnode('0_abc_0rest'), rdf.first, Rdf.literal('3.14', xsd.double)),
  Rdf.triple(Rdf.bnode('0_abc_0rest'), rdf.rest, Rdf.bnode('0_abc_1rest')),
  Rdf.triple(Rdf.bnode('0_abc_1rest'), rdf.first, Rdf.literal('str')),
  Rdf.triple(Rdf.bnode('0_abc_1rest'), rdf.rest, rdf.nil),

  Rdf.triple(Rdf.bnode('1_123'), rdf.first, Rdf.literal('3.14', xsd.double)),
  Rdf.triple(Rdf.bnode('1_123'), rdf.rest, Rdf.bnode('1_123_0rest')),
  Rdf.triple(Rdf.bnode('1_123_0rest'), rdf.first, Rdf.bnode('1_123_1')),
  Rdf.triple(Rdf.bnode('1_123_0rest'), rdf.rest, rdf.nil),
]);


function checkObjectToGraphAndBack(example) {
  const graph = jsObjectToGraph(example);
  /* Comment this line with // for tests update
  turtle.serialize.serializeGraph(graph.graph).onValue(value => {
    console.log('serialized graph for ' + JSON.stringify(example) + ':\n' +
      'Size: ' + graph.graph.triples.toArray().length + '\n' +
      'Root: ' + graph.pointer.value + '\n' + value);
    return true;
  }).observe({end: () => { }});
  // */
  const obj = graphToJsObject(graph.pointer, graph.graph);
  expect(obj).to.be.deep.equals(example);
}

describe('convertor of js object to/from rdf graph', () => {
  it('convert JS object to RDF graph and back', () => {
    checkObjectToGraphAndBack(exampleJs);
  });

  it('convert RDF graph to JS object', () => {
    const obj = graphToJsObject(Rdf.iri('http://root.org'), exampleGraph);
    expect(obj).to.be.deep.equal(exampleJs);
  });

  it('convert JS object with nulls to RDF graph and back', () => {
    checkObjectToGraphAndBack(null);
    checkObjectToGraphAndBack([null]);
    checkObjectToGraphAndBack([[]]);
    checkObjectToGraphAndBack({k: null});
    checkObjectToGraphAndBack({k: []});
    checkObjectToGraphAndBack({k: {}});
    checkObjectToGraphAndBack({k: [{}, null, [], [true, false], {key: null, key2: 123}]});
  });

  it('convert JS object with nulls to RDF graph and back', () => {
    checkObjectToGraphAndBack(undefined);
    checkObjectToGraphAndBack([undefined]);
    checkObjectToGraphAndBack({k: undefined});
    checkObjectToGraphAndBack({k: [{}, undefined, [], [true, false], {key: undefined, key2: 123}]});
  });
});
