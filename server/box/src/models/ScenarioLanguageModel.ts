// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Model functions related to language support for scenarios
 */

import { knex } from '../db/Client';
import {
  LanguageRecord,
  LanguageResource,
  LanguageResourceRecord,
  LanguageResourceValueRecord,
} from '../db/TableInterfaces.auto';
import { logPGError } from '../errors/PostgreSQLErrors';

/**
 * Return the list of languages that are supported for the given scenario.
 * @param scenario_id ID of the scenario
 */
export async function getSupportedLanguages(
  lrFilter: LanguageResource,
): Promise<LanguageRecord[]> {
  try {
    const languages = await knex<LanguageRecord>('language as l')
      .whereNotExists(
        knex<LanguageResourceRecord>('language_resource as lr')
          .where({
            required: true,
            ...lrFilter,
          })
          .whereNotExists(
            knex<LanguageResourceValueRecord>('language_resource_value')
              .where({ valid: true })
              .whereRaw('language_id = l.id')
              .whereRaw('language_resource_id = lr.id'),
          ),
      )
      .select();
    return languages;
  } catch (e) {
    logPGError(e);
    throw e;
  }
}
