import { WorkerRecord } from '@karya/core';
import { knex } from '../Client';
import { BasicModel } from '../Index';

/**
 * Get summary info of all workers
 */
export async function workersSummary(force_refresh: boolean): Promise<any[]> {
  if (force_refresh) {
    await knex.raw(`REFRESH MATERIALIZED VIEW CONCURRENTLY worker_summary`);
  }
  const response = await knex.raw(`SELECT * FROM worker_summary`);

  return response.rows.map((row: any) => {
    const { assigned, skipped, expired, completed, verified, earned, earliest, latest, ...rest } = row;
    const extras = { assigned, skipped, expired, completed, verified, earned, earliest, latest };
    return { ...rest, extras };
  });
}

/**
 * Get summary info of workers for a particular task
 */
export async function workersTaskSummary(task_id: string, force_refresh: boolean): Promise<any[]> {
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

/**
 * Get summary info of workers for a particular task
 */
export async function allWorkerTaskSummary(): Promise<any[]> {
  const response = await knex.raw(`SELECT * FROM worker_task_summary`);
  return response.rows;
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

/**
 * Mark a worker as disabled
 * @param worker_id ID of a worker
 */
export async function markDisabled(worker_id: string): Promise<WorkerRecord> {
  const worker = await BasicModel.getSingle('worker', { id: worker_id });
  const tags = worker.tags.tags;
  if (tags.indexOf(disabledTag) < 0) {
    tags.push(disabledTag);
    const currentTime = new Date().toISOString();
    const updatedWorker = await BasicModel.updateSingle(
      'worker',
      { id: worker_id },
      { tags: { tags }, tags_updated_at: currentTime }
    );
    return updatedWorker;
  } else {
    return worker;
  }
}
