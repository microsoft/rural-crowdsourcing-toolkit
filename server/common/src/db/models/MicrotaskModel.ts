// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { MicrotaskAssignmentRecord, MicrotaskRecord, TaskRecord, WorkerRecord } from '@karya/core';
import { knex } from '../Client';

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
  const maxAssignedMicrotasks = knex<MicrotaskAssignmentRecord>('microtask_assignment')
    .groupBy('microtask_id')
    .havingRaw(`count(microtask_id) >= ${maxAssignments}`)
    .pluck('microtask_id');

  const workerAssignedMicrotasks = knex<MicrotaskAssignmentRecord>('microtask_assignment')
    .where('worker_id', worker.id)
    .pluck('microtask_id');

  const microtasks = await knex<MicrotaskRecord>('microtask')
    .where('task_id', task.id)
    .where('status', 'not in', ['completed', 'paid'])
    .where('id', 'not in', knex.raw('?', [maxAssignedMicrotasks]))
    .where('id', 'not in', knex.raw('?', [workerAssignedMicrotasks]))
    .select();

  return microtasks;
}

/**
 * Get the number of completed assignments for a given microtask
 * @param microtask Microtask record
 */
export async function getCompletedAssignmentsCount(microtask_id: string) {
  const completedAssignmentsCount = await knex<MicrotaskAssignmentRecord>('microtask_assignment')
    .where('microtask_id', microtask_id)
    .whereIn('status', ['completed', 'paid'])
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
    .whereIn('status', ['assigned', 'incomplete'])
    .select();
  return incompleteMicrotasks.length > 0;
}

/**
 * Mark a microtask as completed. This update will not be
 * @param microtask Microtask to be marked complete
 */
export async function markComplete(microtask_id: string) {
  await knex<MicrotaskRecord>('microtask').where('id', microtask_id).update({ status: 'completed' });
}
