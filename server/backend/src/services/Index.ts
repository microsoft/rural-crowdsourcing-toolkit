// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Definition of asynchronous background tasks.
 */

// Bull for async jobs
import Bull from 'bull';

// Db types
import { TaskRecord, BasicModel } from '@karya/db';

// Task action handlers
import { approveTask } from './ApproveTask';
import { validateTask } from './ValidateTask';
import { generateTaskOutput } from './GenerateOutput';

/** Queue and handlers for task validation */

// Task validation queue
export const taskValidationQueue = new Bull<TaskRecord>('validate_task');

// Task validation handler
taskValidationQueue.process(async (job) => validateTask(job.data));

// on failure, set status to invalid
taskValidationQueue.on('failed', async (job) => {
  const task = job.data;
  const errors = [job.failedReason || 'Task validation failed'];
  await BasicModel.updateSingle('task', { id: task.id }, { status: 'invalid', errors: { messages: errors } });
});

/** Queue and handlers for task approval */

// Task approval queue
export const taskApprovalQueue = new Bull<TaskRecord>('approve_task');

// Task approval handler
taskApprovalQueue.process(async (job) => approveTask(job.data));

// On complete, set task status to 'approved'
taskApprovalQueue.on('completed', async (job) => {
  const task = job.data;

  await BasicModel.updateSingle('task', { id: task.id }, { status: 'approved', errors: {}, actions: {} });
});

// On failure, reset task to 'validated'. This is a hack to enable approval
// retry.
taskApprovalQueue.on('failed', async (job) => {
  const task = job.data;
  const errors = [job.failedReason || 'Task approval failed'];
  await BasicModel.updateSingle('task', { id: task.id }, { status: 'validated', errors: { messages: errors } });
});

/** Queue and handler for task output generator */
export const taskOutputGeneratorQueue = new Bull<TaskRecord>('output_generator');

// output generator handler
taskOutputGeneratorQueue.process(async (job) => generateTaskOutput(job.data));
