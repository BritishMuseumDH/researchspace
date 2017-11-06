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

import { WebDriver } from 'selenium-webdriver';
import { Test } from 'tap';
import { Options } from '../../options';
import { testSearch } from '../util';
import { sameSets } from '../../util';

/**
 * @author Artem Kozlov <ak@metaphacts.com>
 */
export async function test_6(driver: WebDriver, test: Test, options: Options) {
  await test.test(
    '6) Find: Concepts has broader gold',
    async (t: Test) => await testSearch(driver, t, options, async (s, d) => {
      await s.setDomain('Concept');
      await s.setRange('Concept');
      await s.setRelation('has broader');
      await s.typeRange('gold');
      await s.toggleRangeNode('gold');
      await s.submitRangeTree();

      const results = await s.getSearchResults();
      await sameSets(t, results, ['thes:x114734']);
    }));
}
