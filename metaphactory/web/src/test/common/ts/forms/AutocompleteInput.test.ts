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

import { createElement, HTMLAttributes } from 'react';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { shallow } from 'enzyme';

import { Rdf } from 'platform/api/rdf';
import {
  AutocompleteInput, AutocompleteInputProps, SparqlBindingValue, FieldValue,
  normalizeFieldDefinition,
} from 'platform/components/forms';
import * as Immutable from 'immutable';

interface AutocompleteProps extends HTMLAttributes<HTMLElement> {
  minimumInput: string;
  templates: { suggestion: string; };
  actions: { onSelected: any; };
}

const DATATYPE = Rdf.iri('http://www.w3.org/2001/XMLSchema-datatypes#string');

const VALUE = {
  value: Rdf.iri('http://www.metaphacts.com/resource/example/test'),
  label: Rdf.literal('label'),
  parent: '',
};

const BASIC_PROPS: AutocompleteInputProps = {
  definition: normalizeFieldDefinition({
    id: 'nameProp',
    label: 'labelProp',
    xsdDatatype: DATATYPE,
    minOccurs: 1,
    maxOccurs: 1,
    valueSetPattern: '',
  }),
  for: 'date',
  value: FieldValue.empty,
  valueSet: Immutable.List<SparqlBindingValue>([VALUE]),
};

const AUTOCOMPLETE_SELECTOR = 'AutoCompletionInput';

describe('AutocompleteInput Component', () => {
  const autocompleteComponent = shallow(createElement(AutocompleteInput, BASIC_PROPS));
  const autocomplete = autocompleteComponent.find(AUTOCOMPLETE_SELECTOR);
  const fieldProps = autocomplete.props() as AutocompleteProps;

  it('render with default parameters', () => {
    expect(autocomplete).to.have.length(1);
  });

  it('have minimum query limit for request', () => {
    expect(fieldProps.minimumInput).to.be.equal(3);
  });

  it('have template for suggestion', () => {
    const template = `<span title="{{label.value}}">{{label.value}}</span>`;
    expect(fieldProps.templates.suggestion).to.be.equal(template);
  });

  it('call callback when value is changed', () => {
    const callback = sinon.spy();
    const props: AutocompleteInputProps = {...BASIC_PROPS, updateValue: callback};
    const wrapper = shallow(createElement(AutocompleteInput, props));
    const inputProps = wrapper.find(AUTOCOMPLETE_SELECTOR).props() as AutocompleteProps;
    inputProps.actions.onSelected();
    expect(callback.called).to.be.true;
  });
});
