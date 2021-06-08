// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Entry point for module managing task operations

import { BasicModel } from '@karya/common';
import { executeForwardTaskLinks } from './ops/AssignmentCompletionHandler';
import { TaskOpRecord, TaskRecordType } from '@karya/core';
import Bull from 'bull';

// Assignment completion handler queues
export type AssignmentCompletionHandlerObject = {
  taskOp: TaskOpRecord;
  task: TaskRecordType;
};

export const assignmentCompletionHandlerQ = new Bull<AssignmentCompletionHandlerObject>(
  'ASSIGNMENT_COMPLETION_HANDLER'
);

assignmentCompletionHandlerQ.process(async (job) => {
  await executeForwardTaskLinks(job.data);
});

// Task operation queues
const taskOpQueues = [assignmentCompletionHandlerQ] as const;

// Set life-cycle event handlers for all queues
taskOpQueues.forEach((queue) => {
  queue.on('active', async (job) => {
    const taskOp = job.data.taskOp;
    const started_at = new Date().toISOString();
    await BasicModel.updateSingle('task_op', { id: taskOp.id }, { status: 'RUNNING', started_at });
  });

  queue.on('completed', async (job) => {
    const taskOp = job.data.taskOp;
    const completed_at = new Date().toISOString();
    await BasicModel.updateSingle('task_op', { id: taskOp.id }, { status: 'COMPLETED', completed_at });
  });

  queue.on('failed', async (job, err) => {
    const taskOp = job.data.taskOp;
    const completed_at = new Date().toISOString();
    const messages = [err.message || 'Undefined error during task operation'];
    await BasicModel.updateSingle(
      'task_op',
      { id: taskOp.id },
      { status: 'FAILED', messages: { messages }, completed_at }
    );
  });
});
