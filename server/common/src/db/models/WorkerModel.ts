import { WorkerRecord } from '@karya/core';
import { knex } from '../Client';

/**
 * Get summary info of all workers
 */
export async function workersSummary(): Promise<any[]> {
  const response = await knex.raw(`
    SELECT
      w.*,
      COALESCE((mta.assigned + mta.completed + mta.verified)::int, 0) as assigned,
      COALESCE((mta.completed + mta.verified)::int, 0) as completed,
      COALESCE((mta.verified)::int, 0) as verified,
      COALESCE((mta.earned)::int, 0) as earned,
      (mta.earliest) as earliest,
      (mta.latest) as latest
    FROM 
      worker as w
    LEFT JOIN
    (
      SELECT
        worker_id,
        COALESCE(SUM((status='ASSIGNED')::int), 0) as assigned,
        COALESCE(SUM((status='COMPLETED')::int), 0) as completed,
        COALESCE(SUM((status='VERIFIED')::int), 0) as verified,
        COALESCE(SUM(credits), 0) as earned,
        MIN(created_at) as earliest,
        MAX(completed_at) as latest
      FROM
        microtask_assignment
      GROUP BY worker_id
    ) as mta
  ON w.id = mta.worker_id
    `);

  return response.rows.map((row: any) => {
    const { assigned, completed, verified, earned, earliest, latest, ...rest } = row;
    const extras = { assigned, completed, verified, earned, earliest, latest };
    return { ...rest, extras };
  });
}

/**
 * Get summary info of workers for a particular task
 */
export async function workersTaskSummary(task_id: string): Promise<any[]> {
  const response = await knex.raw(`
    SELECT
      w.*,
      COALESCE((mta.assigned + mta.completed + mta.verified)::int, 0) as assigned,
      COALESCE((mta.completed + mta.verified)::int, 0) as completed,
      COALESCE((mta.verified)::int, 0) as verified,
      COALESCE((mta.earned)::int, 0) as earned
    FROM 
      worker as w
    LEFT JOIN
    (
      SELECT
        worker_id,
        COALESCE(SUM((status='ASSIGNED')::int), 0) as assigned,
        COALESCE(SUM((status='COMPLETED')::int), 0) as completed,
        COALESCE(SUM((status='VERIFIED')::int), 0) as verified,
        COALESCE(SUM(credits), 0) as earned
      FROM
        microtask_assignment
      WHERE
        task_id = ${task_id}
      GROUP BY worker_id
    ) as mta
    ON w.id = mta.worker_id
    WHERE
      mta.assigned > 0
    `);

  return response.rows.map((row: any) => {
    const { assigned, completed, verified, earned, ...rest } = row;
    const extras = { assigned, completed, verified, earned };
    return { ...rest, extras };
  });
}

/** Code to handle worker disabling */
const disabledTag = '_DISABLED_';

/**
 * Check if a worker is disabled
 * @param worker Worker record
 */
export function isDisabled(worker: Pick<WorkerRecord, 'tags'>): boolean {
  const workerTags = worker.tags.tags;
  return workerTags.indexOf(disabledTag) >= 0;
}
