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

import { PropTypes } from 'react';
import * as Kefir from 'kefir';

import { Rdf } from 'platform/api/rdf';
import { SearchProfileStore } from '../data/profiles/SearchProfileStore';
import * as Model from '../data/search/Model';
import * as FacetModel from '../data/facet/Model';
import { SemanticSearchConfig } from '../config/SearchConfig';

export type ExtendedSearchValue = Model.Resource | {label: string; query: SparqlJs.SelectQuery}

export type SemanticSearchContext =
  InitialQueryContext & ResultContext & FacetContext;

export interface InitialQueryContext {
  domain: Data.Maybe<Model.Category>
  baseConfig: SemanticSearchConfig
  extendedSearch: Data.Maybe<{value: ExtendedSearchValue, range: Model.Category}>
  baseQueryStructure: Data.Maybe<Model.Search>
  setDomain(domain: Model.Category)
  setBaseQuery(query: Data.Maybe<SparqlJs.SelectQuery>)
  setBaseQueryStructure(queryStructure: Data.Maybe<Model.Search>)
  searchProfileStore: Data.Maybe<SearchProfileStore>
}

export const InitialQueryContextTypes: Record<keyof InitialQueryContext, any> = {
  domain: PropTypes.any.isRequired,
  baseConfig: PropTypes.any.isRequired,
  extendedSearch: PropTypes.any.isRequired,
  baseQueryStructure: PropTypes.any.isRequired,
  setDomain: PropTypes.func.isRequired,
  setBaseQuery: PropTypes.func.isRequired,
  setBaseQueryStructure: PropTypes.func.isRequired,
  searchProfileStore: PropTypes.any.isRequired,
};

export interface FacetContext {
  domain: Data.Maybe<Model.Category>
  baseConfig: SemanticSearchConfig
  baseQuery: Data.Maybe<SparqlJs.SelectQuery>
  baseQueryStructure: Data.Maybe<Model.Search>
  resultsStatus: { loaded: boolean; count: number | undefined; }
  facetStructure: Data.Maybe<FacetModel.Ast>
  setFacetStructure(structure: FacetModel.Ast)
  setFacetedQuery(query: SparqlJs.SparqlQuery)
  searchProfileStore: Data.Maybe<SearchProfileStore>
}

export const FacetContextTypes: Record<keyof FacetContext, any> = {
  domain: PropTypes.any.isRequired,
  baseConfig: PropTypes.any.isRequired,
  baseQuery: PropTypes.any.isRequired,
  baseQueryStructure: PropTypes.any.isRequired,
  resultsStatus: PropTypes.object.isRequired,
  facetStructure: PropTypes.any.isRequired,
  setFacetStructure: PropTypes.func.isRequired,
  setFacetedQuery: PropTypes.func.isRequired,
  searchProfileStore: PropTypes.any.isRequired,
};

export type ResultOperation =
  { type: 'count'; task: Kefir.Property<number> } |
  { type: 'other'; task: Kefir.Property<void> };

export interface ResultContext {
  domain: Data.Maybe<Model.Category>
  baseConfig: SemanticSearchConfig
  resultQuery: Data.Maybe<SparqlJs.SelectQuery>
  baseQueryStructure: Data.Maybe<Model.Search>
  facetStructure: Data.Maybe<FacetModel.Ast>
  searchProfileStore: Data.Maybe<SearchProfileStore>
  useInExtendedFcFrSearch(
    item: {value: ExtendedSearchValue, range: Model.Category}
  )
  bindings: {[variable: string]: Rdf.Node}
  notifyResultLoading(operation: ResultOperation)
  resultState: { [componentId: string]: object }
  updateResultState(componentId: string, stateChange: object)
}

export const ResultContextTypes: Record<keyof ResultContext, any> = {
  domain: PropTypes.any.isRequired,
  baseConfig: PropTypes.any.isRequired,
  resultQuery: PropTypes.any.isRequired,
  baseQueryStructure: PropTypes.any.isRequired,
  facetStructure: PropTypes.any.isRequired,
  searchProfileStore: PropTypes.any.isRequired,
  useInExtendedFcFrSearch: PropTypes.any.isRequired,
  bindings: PropTypes.any.isRequired,
  notifyResultLoading: PropTypes.func.isRequired,
  resultState: PropTypes.object.isRequired,
  updateResultState: PropTypes.func.isRequired,
};
