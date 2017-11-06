/*
 * Copyright (C) 2015-2017, © Trustees of the British Museum
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

// ///<reference path="../../../../../../typings/tsd.d.ts" />
// /*!
//  * Copyright (C) 2015-2017, © Trustees of the British Museum
//  *
//  * This library is free software; you can redistribute it and/or
//  * modify it under the terms of the GNU Lesser General Public
//  * License as published by the Free Software Foundation; either
//  * version 2.1 of the License, or (at your option) any later version.
//  *
//  * This library is distributed in the hope that it will be useful,
//  * but WITHOUT ANY WARRANTY; without even the implied warranty of
//  * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
//  * Lesser General Public License for more details.
//  *
//  * You should have received a copy of the GNU Lesser General Public
//  * License along with this library; if not, you can receive a copy
//  * of the GNU Lesser General Public License from http://www.gnu.org/
//  */

// import { Component, DOM as D, createFactory } from 'react';
// import _ = require('lodash');
// import * as ReactSelectComponent from 'react-select';
// import maybe = require('data.maybe');
// import * as sparqljs from 'sparqljs';

// import * as S from '../../data/search/Model';

// const ReactSelect = createFactory(ReactSelectComponent);

// interface DatasetSelectionProps{
//   selectableDatasets: {label:string,value:string}[]
//   preSelectedDatasets: string[],
//   onChangeCallback: (datasets: string[]) =>void
// }

// export default class DatasetSelectionComponent extends Component<DatasetSelectionProps, {}>  {
//   render() {
//     var selectOptions = {
//            className: 'dataset-selector__multi-select',
//            multi:true,
//            options: this.props.selectableDatasets,
//            optionRenderer: (o) => o.label,
//            clearable: true,
//            allowCreate: false,
//            autoload: true,
//            clearAllText: "Remove all",
//            clearValueText: "Remove dataset",
//            delimiter: "|",
//            disabled: false,
//            ignoreCase: true,
//            matchPos: "any",
//            matchProp: "any",
//            noResultsText: "No dataset found",
//            placeholder: "Select dataset(s) to search over. Default: all",
//            onChange: this.onChangeDatasetSelection.bind(this),
//            value: this.props.preSelectedDatasets
//     };
//     return ReactSelect(selectOptions)
//   }

//   private onChangeDatasetSelection(datasets: Array<{label:string,value:string}>){
//     this.props.onChangeCallback(
//       _.map(datasets, d => d.value)
//     );
//   }

//   public static addDatasetConstraintToQuery(
//     query: SparqlJs.Query, search: S.Ast, datasets: string[]
//   ): SparqlJs.SparqlQuery {
//     if(search.domain.isNothing)
//       return query;
//     const queryCopy = _.cloneDeep(query);

//     //TODO make subject configurable
//     var fcTriplePattern = '?subject a <'+search.domain.get().iri.value+'>';
//     var graphs = datasets.join('>,<')

//     var datasetQuery = 'SELECT * WHERE{ GRAPH ?g {'+ fcTriplePattern +'} FILTER (?g IN (<'+graphs+'>))}';
//     var parsedDatasetQuery = (new sparqljs.Parser()).parse(datasetQuery) as SparqlJs.Query;
//     queryCopy.where.push(<any>parsedDatasetQuery.where); // TODO: incompatible types
//     return queryCopy;
//   }
// }
