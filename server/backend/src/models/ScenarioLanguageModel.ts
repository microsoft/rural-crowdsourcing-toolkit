// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Model functions related to language support for scenarios
 */

import { knex, LanguageRecord, LanguageResource, LanguageResourceRecord, LanguageResourceValueRecord } from '@karya/db';
import { logPGError } from '../errors/PostgreSQLErrors';

/**
 * Return the list of language IDs corresponding to the languages that are
 * supported for the given scenario.
 * @param scenario_id ID of the scenario
 */
export async function getSupportedLanguages(lrFilter: LanguageResource): Promise<LanguageRecord[]> {
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
              .whereRaw('language_resource_id = lr.id')
          )
      )
      .select();
    return languages;
  } catch (e) {
    logPGError(e);
    throw e;
  }
}

/**
 * Determine if a language is supported for the specified list of resources
 * @param languageID ID of the language
 * @param lrFilter LR filter for the list of resources
 */
export async function isLanguageSupported(languageID: number, lrFilter: LanguageResource): Promise<boolean> {
  const unsupporedLRs = await knex<LanguageResourceRecord>('language_resource as lr')
    .where({
      required: true,
      ...lrFilter,
    })
    .whereNotExists(
      knex<LanguageResourceValueRecord>('language_resource_value')
        .where({ valid: true })
        .whereRaw(`language_id = ${languageID}`)
        .whereRaw('language_resource_id = lr.id')
    )
    .select();
  return unsupporedLRs.length == 0;
}
