// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/** Extra model functions for the language resource table */

import { knex } from '../db/Client';
import {
  LanguageResource,
  LanguageResourceRecord,
  LanguageResourceValueRecord,
} from '../db/TableInterfaces.auto';
import { logPGError } from '../errors/PostgreSQLErrors';

/**
 * Update an existing language resoruce record. For all the matched records, the
 * language resource values for the corresponding records should marked for
 * update.
 *
 * @param match object specifying the match criterion
 * @param updates object specifying the updates to matched objects
 */
export async function updateLanguageResource(
  match: LanguageResource,
  updates: LanguageResource,
) {
  try {
    // Make the updates
    const updatedIds = await knex<LanguageResourceRecord>('language_resource')
      .where(match)
      .update(updates)
      .returning('id');

    // Update language resource value records for all matching ids
    await knex<LanguageResourceValueRecord>('language_resource_value')
      .whereIn('language_resource_id', updatedIds)
      .update({ need_update: true });
  } catch (e) {
    logPGError(e);
    throw e;
  }
}
