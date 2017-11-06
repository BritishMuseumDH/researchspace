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

import { TemplateScope } from 'platform/api/services/template';

// This file contains generic helper functions for Handlebars templates.

/**
 * Handlebars doesn't have any meance to use comparison operators in templates.
 * This function provides conditional if function for templates.
 *
 * Ex.:
 * {{#ifCond value ">=" 0}}<div>some content</div>{{else}}<div>some other content</div>{{/ifCond}}
 */
function checkCondition(v1, operator, v2) {
  switch (operator) {
  case '==':
    // tslint:disable-next-line:triple-equals
    return (v1 == v2);
  case '===':
    return (v1 === v2);
  case '!==':
    return (v1 !== v2);
  case '<':
    return (v1 < v2);
  case '<=':
    return (v1 <= v2);
  case '>':
    return (v1 > v2);
  case '>=':
    return (v1 >= v2);
  case '&&':
    return (v1 && v2);
  case '||':
    return (v1 || v2);
  default:
    return false;
  }
}

export function register(scope: TemplateScope) {
  /**
   * if operator for handlebars templates.
   */
  scope.registerHelper('ifCond', function (v1, operator, v2, options) {
    return checkCondition(v1, operator, v2)
        ? options.fn(this)
        : options.inverse(this);
  });

  /**
   * Raw block for template escaping.
   */
  scope.registerHelper('raw', function(options) {
    return options.fn(this);
  });
}
