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

import * as Handlebars from 'handlebars';

import { WrappingError } from 'platform/api/async';
import { Rdf } from 'platform/api/rdf';

import { registerHelperFunctions, ContextCapturer, CapturedContext } from './functions';

import {
  ParsedTemplate, fetchRemoteTemplate, parseTemplate, isRemoteReference,
  createHandlebarsWithIRILookup,
} from './RemoteTemplateFetcher';

const EMPTY_TEMPLATE: CompiledTemplate = () => '';

export type CompiledTemplate = (
  dataContext?: object,
  options?: {
    capturer?: ContextCapturer;
    parentContext?: CapturedContext;
  }
) => string;

/**
 * Represents an isolated Handlebars compiler instance acting as a container
 * for partials and helpers with an ability to clone it.
 *
 * Cloned scope doesn't depend on it's parent, e.g. registering a helper or a
 * partial on a parent scope won't affect cloned scope.
 *
 * @example
 * // compile template with default global partials and helpers
 * TemplateScope.default.compile('<div>{{foo}}</div>')
 *   .then(template => { ... });
 *
 * // create an isolated scope by cloning the default one
 * const clonedScope = TemplateScope.default.clone();
 * clonedScope.registerPartial('foo', '<span>{{> @partial-block}}<span>');
 *
 * // use either local partials or remote ones
 * // (by specifying IRI as a partial name)
 * clonedScope.compile('{{#> foo}} {{> platform:someTemplate}} {{/foo}}')
 *   .then(template => { ... });
 */
export class TemplateScope {
  static readonly default = new TemplateScope(createHandlebarsWithIRILookup());
  /** DO NOT USE. For testing purposes only. */
  static _fetchRemoteTemplate = fetchRemoteTemplate;

  private readonly compiledCache = new Map<string, HandlebarsTemplateDelegate>();

  private readonly partials = new Map<string, ParsedTemplate>();
  private readonly helpers = new Map<string, Function>();

  private constructor(
    private readonly handlebars: typeof Handlebars
  ) {}

  clearCache() {
    this.compiledCache.clear();
  }

  getPartial(name: string): ParsedTemplate {
    return this.partials.get(name);
  }

  registerHelper(name: string, body: Function) {
    if (this.helpers.has(name)) {
      throw new Error(`Template helper '${name}' already registered`);
    }
    this.helpers.set(name, body);
    this.handlebars.registerHelper(name, body);
  }

  registerPartial(id: string, partial: string | ParsedTemplate) {
    if (this.partials.has(id)) {
      throw new Error(`Template partial '${id}' already registered`);
    }
    const parsedTemplate = typeof partial === 'string' ? parseTemplate(partial) : partial;
    this.partials.set(id, parsedTemplate);
    this.handlebars.registerPartial(id, parsedTemplate.ast);
  }

  clone() {
    const derived = new TemplateScope(createHandlebarsWithIRILookup());
    this.helpers.forEach((body, key) => derived.registerHelper(key, body));
    this.partials.forEach((body, key) => derived.registerPartial(key, body));
    return derived;
  }

  compile(template: string): Promise<CompiledTemplate> {
    if (template === undefined || template === null) {
      return Promise.resolve(EMPTY_TEMPLATE);
    }
    const fromCache = this.compiledCache.get(template);
    if (fromCache) {
      return Promise.resolve(fromCache);
    }
    return this.resolve(template).then(resolved => {
      const withParentContext: CompiledTemplate =
        (local, {capturer, parentContext} = {}) => resolved(local, {
          data: {
            [ContextCapturer.DATA_KEY]: capturer,
            [CapturedContext.DATA_KEY]: parentContext,
          }
        });
      this.compiledCache.set(template, withParentContext);
      return withParentContext;
    });
  }

  /**
   * Synchronously compiles template without resolving remote template references.
   * @deprecated
   */
  compileWithoutRemote(template: string): CompiledTemplate {
    if (template === undefined || template === null) {
      return EMPTY_TEMPLATE;
    }
    const fromCache = this.compiledCache.get(template);
    if (fromCache) {
      return fromCache;
    }
    const compiled = this.handlebars.compile(template);
    const withParentContext: CompiledTemplate =
      (local, {capturer, parentContext} = {}) => compiled(local, {
        data: {
          [ContextCapturer.DATA_KEY]: capturer,
          [CapturedContext.DATA_KEY]: parentContext,
        }
      });
    this.compiledCache.set(template, withParentContext);
    return withParentContext;
  }

  private resolve(templateBody: string): Promise<HandlebarsTemplateDelegate> {
    return Promise.resolve(templateBody).then(parseTemplate).then(parsed => {
      const dependencies = new Map<string, ParsedTemplate>();
      return recursiveResolve(parsed, dependencies, this.loadByReference).then(() => {
        dependencies.forEach((dependency, iri) => {
          if (!this.partials.has(iri)) {
            this.handlebars.registerPartial(iri, dependency.ast);
          }
        });
      }).then(() => this.handlebars.compile(parsed.ast));
    });
  }

  /** Loads partial by local name or remote reference. */
  private loadByReference = (reference: string): Promise<ParsedTemplate> => {
    if (this.partials.has(reference)) {
      return Promise.resolve(this.partials.get(reference));
    } else if (isRemoteReference(reference)) {
      return TemplateScope._fetchRemoteTemplate(Rdf.iri(reference));
    } else {
      return Promise.reject(new Error(
        `Parial template reference '${reference}' is not an IRI and not found ` +
        `in current template scope.`));
    }
  }
}

// initialize generic custom functions which can be used in handlebars templates
registerHelperFunctions(TemplateScope.default);

function recursiveResolve(
  parsedTemplate: ParsedTemplate,
  dependencies: Map<string, ParsedTemplate>,
  load: (reference: string) => Promise<ParsedTemplate>
): Promise<{}> {
  return Promise.resolve(parsedTemplate).then(body => {
    const referencesToLoad = parsedTemplate.references
      .filter(reference => !dependencies.has(reference));

    for (const reference of referencesToLoad) {
      // mark dependency to prevent multiple loading
      dependencies.set(reference, null);
    }

    const fetchedDependencies = referencesToLoad.map(
      reference => load(reference)
        .then(template => ({reference, template}))
        .catch(error => {
          throw new WrappingError(`Failed to load template '${reference}'`, error);
        })
    );

    return Promise.all(fetchedDependencies);
  }).then(fetched => {
    for (const {reference, template} of fetched) {
      dependencies.set(reference, template);
    }

    return Promise.all(fetched.map(
      ({reference, template}) => recursiveResolve(template, dependencies, load)
        .catch(error => {
          throw new WrappingError(
            `Error while resolving dependencies of template '${reference}'`, error);
        })
    ));
  });
}
