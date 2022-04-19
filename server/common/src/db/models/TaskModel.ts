// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { knex } from '../Client';

/**
 * Get summary info for all tasks
 */
export async function tasksSummary(force_refresh: boolean): Promise<any[]> {
  if (force_refresh) {
    await knex.raw(`REFRESH MATERIALIZED VIEW CONCURRENTLY task_summary`);
  }
  const response = await knex.raw(`SELECT * FROM task_summary`);

  return response.rows.map((row: any) => {
    const { assigned, completed, verified, cost, ...rest } = row;
    const extras = { assigned, completed, verified, cost };
    return { ...rest, extras };
  });
}
