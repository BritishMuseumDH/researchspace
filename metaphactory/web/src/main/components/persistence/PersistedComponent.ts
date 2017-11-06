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

import * as Kefir from 'kefir';

import {DOM as D, createElement, ReactElement, cloneElement} from 'react';

import { Rdf } from 'platform/api/rdf';
import { Component } from 'platform/api/components';
import { ModuleRegistry } from 'platform/api/module-loader';
import {ldpc} from 'platform/api/services/ldp';
import { VocabPlatform } from 'platform/api/rdf/vocabularies/vocabularies';
import {graphToComponent} from 'platform/api/persistence/ComponentPersistence';

import {Spinner} from 'platform/components/ui/spinner/Spinner';


interface Props {
  iri: string
}

interface State {
  component?: ReactElement<any>
}

/**
 * This component gets persisted component from DB by iri and renders it
 * @example
 *  <mp-persisted-component iri="http://127.0.0.1:10214/container/persistedComponentContainer/saved_bar_chart" />
 */
export class PersistedComponent extends Component<Props, State> {
  constructor(props: Props, context: any) {
    super(props, context);
    this.state = {component: undefined};
  }

  prepareComponent(iri: string) {
    ldpc(VocabPlatform.PersistedComponentContainer.value).get(Rdf.iri(iri)).flatMap(graph => {
      const {componentType, componentProps} = graphToComponent(graph);
      return Kefir.fromPromise(ModuleRegistry.renderWebComponent(componentType, componentProps));
    }).onValue(component => {
      this.setState({component});
    });
  }

  componentDidMount() {
    this.prepareComponent(this.props.iri);
  }

  componentWillReceiveProps(props: Props) {
    this.prepareComponent(props.iri);
  }

  render() {
    return this.state.component ? this.state.component : Spinner();
  }
}

export default PersistedComponent;
