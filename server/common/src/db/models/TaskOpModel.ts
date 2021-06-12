// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Extra task op table models

import { TaskOpRecord } from '@karya/core';
import { knex } from '../Client';

/**
 * Get the previous successful execution of an operation for a task. The
 * operation type and the task ID are implicitly specified using a task op
 * record.
 * @param taskOp A task operation
 */
export async function previousOpTime(taskOp: TaskOpRecord): Promise<string> {
  const previousOp = await knex<TaskOpRecord>('task_op')
    .where('task_id', taskOp.task_id)
    .where('op_type', taskOp.op_type)
    .where('status', 'COMPLETED')
    .whereNot('id', taskOp.id)
    .orderBy('created_at', 'desc')
    .first();
  return previousOp?.created_at ?? new Date(0).toISOString();
}
