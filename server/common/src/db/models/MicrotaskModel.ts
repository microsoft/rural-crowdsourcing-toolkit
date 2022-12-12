// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { MicrotaskAssignmentRecord, MicrotaskRecord, ScenarioName, TaskRecord, WorkerRecord } from '@karya/core';
import { knex } from '../Client';
import { updateSingle } from './BasicModel';

// TODO: Many functions here can be optimized

/**
 * Get a list of microtask records from the specified task that can
 * potentially be assigned to the specified worker, subject to a specified
 * maximum number of assignments for each microtask
 * @param task Task record
 * @param worker Worker record
 * @param maxAssignments Maximum number of permissible assignments
 */
export async function getAssignableMicrotasks(
  task: TaskRecord,
  worker: WorkerRecord,
  maxAssignments: number = Number.MAX_SAFE_INTEGER
) {
  const maxAssignedMicrotasks =
    maxAssignments > 1
      ? knex<MicrotaskAssignmentRecord>('microtask_assignment')
          .where('task_id', task.id)
          .whereNotIn('status', ['SKIPPED', 'EXPIRED'])
          .groupBy('microtask_id')
          .havingRaw(`count(microtask_id) >= ${maxAssignments}`)
          .pluck('microtask_id')
      : knex<MicrotaskAssignmentRecord>('microtask_assignment')
          .where('task_id', task.id)
          .whereNotIn('status', ['SKIPPED', 'EXPIRED'])
          .pluck('microtask_id');

  const workerAssignedMicrotasks = knex<MicrotaskAssignmentRecord>('microtask_assignment')
    .where('worker_id', worker.id)
    .pluck('microtask_id');

  const unassignableMicrotasks = new Set(await workerAssignedMicrotasks.union(maxAssignedMicrotasks));

  const limit = task.assignment_batch_size || 100;
  const microtasks = await knex<MicrotaskRecord>('microtask')
    .where('task_id', task.id)
    .whereNot('status', 'COMPLETED')
    .orderByRaw('random()')
    .limit(limit * 4)
    .select();

  return microtasks.filter((mt) => !unassignableMicrotasks.has(mt.id));
}

export async function getAllAssignedCount(worker_id: string) {
  const allAssignedCount = await knex.raw(
    `select task_id, count(*) from microtask_assignment where worker_id = ${worker_id} group by task_id`
  );
  const rows: { task_id: string; count: string }[] = allAssignedCount.rows;
  const result: { [id: string]: number } = {};
  rows.forEach(({ task_id, count }) => {
    result[task_id] = Number.parseInt(count, 10);
  });
  return result;
}

export async function getAssignedCount(worker_id: string, task_id: string) {
  const assignedCount = await knex<MicrotaskAssignmentRecord>('microtask_assignment')
    .where('worker_id', worker_id)
    .where('task_id', task_id)
    .count();
  return assignedCount[0].count as number;
}

/**
 * Get the number of completed assignments for a given microtask
 * @param microtask Microtask record
 */
export async function getCompletedAssignmentsCount(microtask_id: string) {
  const completedAssignmentsCount = await knex<MicrotaskAssignmentRecord>('microtask_assignment')
    .where('microtask_id', microtask_id)
    .whereIn('status', ['COMPLETED', 'VERIFIED'])
    .count();
  return completedAssignmentsCount[0].count;
}

/**
 * Check if a worker has any incomplete microtasks
 * @param worker_id ID of the worker
 */
export async function hasIncompleteMicrotasks(worker_id: string): Promise<boolean> {
  const incompleteMicrotasks = await knex<MicrotaskAssignmentRecord>('microtask_assignment')
    .where('worker_id', worker_id)
    .whereIn('status', ['ASSIGNED'])
    .select();
  return incompleteMicrotasks.length > 0;
}

export async function hasIncompleteMicrotasksForScenario(worker_id: string, scenario: ScenarioName) {
  const result = await knex<MicrotaskAssignmentRecord>('microtask_assignment')
    .leftJoin('task', 'microtask_assignment.task_id', 'task.id')
    .where({
      'microtask_assignment.worker_id': worker_id,
      'microtask_assignment.status': 'ASSIGNED',
      'task.scenario_name': scenario,
    })
    .count();
  return result[0].count > 0;
}

/**
 * Mark a microtask as completed. This update will not be
 * @param microtask Microtask to be marked complete
 */
export async function markComplete(microtask_id: string, output: any = null) {
  await updateSingle('microtask', { id: microtask_id }, { status: 'COMPLETED', output });
}

/**
 * Get the number of unique responses received so far for a microtask
 * @param microtask_id ID of the microtask
 */
export async function uniqueResponseCount(microtask_id: string): Promise<number> {
  const count = await knex.raw(
    `SELECT COUNT(DISTINCT(output::json ->> 'data'))::int FROM microtask_assignment WHERE microtask_id = ?`,
    [microtask_id]
  );
  return count.rows[0].count;
}

/**
 * Get the number of max matching responses received so far for a microtask
 * @param microtask_id ID of the microtask
 */
export async function matchingResponseCount(microtask_id: string): Promise<number> {
  const count = await knex.raw(
    `SELECT MAX(t.c)::int FROM (SELECT output::json ->> 'data' AS d, COUNT(*) AS c FROM microtask_assignment WHERE microtask_id = ? GROUP BY d) AS t WHERE t.d IS NOT NULL`,
    [microtask_id]
  );
  return count.rows[0].max;
}

/**
 * Get all microtask info for a task. Include summary of assignments
 */
export async function microtasksWithAssignmentSummary(task_id: string): Promise<any[]> {
  const response = await knex.raw(`
  SELECT id, task_id, assigned, completed, verified, cost FROM microtask_summary
  WHERE
    task_id = ${task_id}
  `);

  return response.rows.map((row: any) => {
    const { assigned, completed, verified, cost, ...rest } = row;
    const extras = { assigned, completed, verified, cost };
    return { ...rest, extras };
  });
}

/**
 * Get summary of assignment status for all microtasks of a given task.
 */
export async function microtasksSummary(task_id: string) {
  const response = await knex.raw(`
      SELECT
        microtask_id,
        COALESCE(SUM((status='ASSIGNED')::int), 0) as assigned,
        COALESCE(SUM((status='COMPLETED')::int), 0) as completed,
        COALESCE(SUM((status='VERIFIED')::int), 0) as verified,
        COALESCE(SUM(credits), 0) as cost
      FROM
        microtask_assignment
      WHERE
        task_id = ${task_id}
      GROUP BY microtask_id
  `);

  return response.rows;
}
