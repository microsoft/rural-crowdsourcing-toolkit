// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { MicrotaskAssignmentRecord, WorkerRecord } from '@karya/core';
import { knex } from '../Index';

/**
 * Check incorrectly expired tasks and reassign the first batch back to the user.
 */
export async function reassignIncorrectlyExpiredAssignments(worker: WorkerRecord): Promise<boolean> {
  // Get the min of created_at from incorrectly expired assignments
  const result = await knex<MicrotaskAssignmentRecord>('microtask_assignment')
    .where({
      status: 'EXPIRED',
      worker_id: worker.id,
    })
    .whereRaw('deadline > now()')
    .min('created_at');

  // Extract min created_at
  const minCreatedAt = result[0].min;

  if (minCreatedAt == null) {
    return false;
  }

  // Get batch end by adding 2 seconds to min
  const batchEnd = new Date(new Date(minCreatedAt).getTime() + 2000).toISOString();

  // Get the batch
  await knex<MicrotaskAssignmentRecord>('microtask_assignment')
    .where({ status: 'EXPIRED', worker_id: worker.id })
    .whereRaw(`created_at < '${batchEnd}'`)
    .update({ status: 'ASSIGNED' });

  return true;
}
