// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Entry point for module managing task operations

import { BasicModel } from '@karya/common';
import { assignmentCompletionHandlerQ } from './ops/AssignmentCompletionHandler';

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
