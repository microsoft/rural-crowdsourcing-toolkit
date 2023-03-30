// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { knex } from '../Client';

/**
 * Get summary info for all tasks
 */
export async function tasksSummary(): Promise<any[]> {
  const response = await knex.raw(`
    SELECT
      task_id,
      COALESCE(SUM((status='ASSIGNED' OR status='COMPLETED' OR status='VERIFIED')::int), 0) as assigned,
      COALESCE(SUM((status='COMPLETED' OR status='VERIFIED')::int), 0) as completed,
      COALESCE(SUM((status='VERIFIED')::int), 0) as verified,
      COALESCE(SUM(credits), 0) as cost
    FROM
      microtask_assignment
    GROUP BY task_id;
    `);

  return response.rows.map((row: any) => {
    const { assigned, completed, verified, cost, ...rest } = row;
    const extras = { assigned, completed, verified, cost };
    return { ...rest, extras };
  });
}
