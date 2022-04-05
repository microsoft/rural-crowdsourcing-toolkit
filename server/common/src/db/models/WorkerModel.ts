import { knex } from '../Client';

/**
 * Get summary info of all workers
 */
export async function workersSummary(force_refresh?: string): Promise<any[]> {
  if (force_refresh) {
    await knex.raw(`REFRESH MATERIALIZED VIEW CONCURRENTLY worker_summary`);
  }
  const response = await knex.raw(`SELECT * FROM worker_summary`);

  return response.rows.map((row: any) => {
    const { assigned, completed, verified, earned, earliest, latest, ...rest } = row;
    const extras = { assigned, completed, verified, earned, earliest, latest };
    return { ...rest, extras };
  });
}

/**
 * Get summary info of workers for a particular task
 */
export async function workersTaskSummary(task_id: string, force_refresh?: string): Promise<any[]> {
  if (force_refresh) {
    await knex.raw(`REFRESH MATERIALIZED VIEW CONCURRENTLY worker_task_summary`);
  }
  const response = await knex.raw(`
  SELECT * FROM worker_task_summary
  WHERE
    task_id = ${task_id}
    `);

  return response.rows.map((row: any) => {
    const { assigned, completed, verified, earned, ...rest } = row;
    const extras = { assigned, completed, verified, earned };
    return { ...rest, extras };
  });
}
