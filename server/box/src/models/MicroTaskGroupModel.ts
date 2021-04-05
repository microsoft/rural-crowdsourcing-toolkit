// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/** Extra model functions for the language resource table */

import { knex } from '../db/Client';
import {
  MicrotaskGroupAssignmentRecord,
  MicrotaskGroupRecord,
  MicrotaskRecord,
  TaskRecord,
  WorkerRecord,
} from '@karya/db';

/**
 * Get a list of microtask group records from the specified task that can
 * potentially be assigned to the specified worker, subject to a specified
 * maximum number of assignments for each microtask group
 * @param task Task record
 * @param worker Worker record
 * @param maxAssignments Maximum number of permissible assignments
 */
export async function getAssignableMicrotaskGroups(
  task: TaskRecord,
  worker: WorkerRecord,
  maxAssignments: number = Number.MAX_SAFE_INTEGER,
) {
  const maxAssignedGroups = knex<MicrotaskGroupAssignmentRecord>(
    'microtask_group_assignment',
  )
    .groupBy('microtask_group_id')
    .havingRaw(`count(microtask_group_id) >= ${maxAssignments}`)
    .pluck('microtask_group_id');

  const workerAssignedGroups = knex<MicrotaskGroupAssignmentRecord>(
    'microtask_group_assignment',
  )
    .where('worker_id', worker.id)
    .pluck('microtask_group_id');

  const microtaskGroups = await knex<MicrotaskGroupRecord>('microtask_group')
    .where('task_id', task.id)
    .where('status', 'not in', ['completed'])
    .where('id', 'not in', knex.raw('?', [maxAssignedGroups]))
    .where('id', 'not in', knex.raw('?', [workerAssignedGroups]))
    .select();

  return microtaskGroups;
}

/**
 * Compute the total number of credits for a microtask group
 * @param microtaskGroup Group for which we need credits
 */
export async function getTotalCredits(microtaskGroup: MicrotaskGroupRecord) {
  const credits = await knex<MicrotaskRecord>('microtask')
    .where('group_id', microtaskGroup.id)
    .sum('credits');
  return credits[0].sum;
}

/**
 * Get the number of completed assignments for a given microtask
 * @param microtask Microtask record
 */
export async function getCompletedAssignmentsCount(
  microtaskGroup: MicrotaskGroupRecord,
) {
  const completedAssignmentsCount = await knex<MicrotaskGroupAssignmentRecord>(
    'microtask_group_assignment',
  )
    .where('microtask_group_id', microtaskGroup.id)
    .whereIn('status', ['completed'])
    .count();
  return completedAssignmentsCount[0].count;
}

/**
 * Mark a microtask as completed. This update will not be
 * @param microtask Microtask to be marked complete
 */
export async function markComplete(microtaskGroup: MicrotaskGroupRecord) {
  await knex<MicrotaskGroupRecord>('microtask_group')
    .where('id', microtaskGroup.id)
    .update({ status: 'completed' });
}
