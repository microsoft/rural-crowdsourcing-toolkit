// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Entry point for module managing task operations

import { BasicModel } from '@karya/common';
import { executeForwardTaskLinks, ForwardTaskLinkHandlerObject } from './ops/ForwardTaskLinkHandler';
import { executeBackwardTaskLinks, BackwardTaskLinkHandlerObject } from './ops/BackwardTaskLinkHandler';
import Bull, { QueueOptions } from 'bull';
import { generateTaskOutput, TaskOutputGeneratorObject } from './ops/OutputGenerator';
import { processInputFile, TaskInputProcessorObject } from './ops/InputProcessor';
import { envGetString } from '@karya/misc-utils';

const REDIS_CONNECTION: QueueOptions = {
  redis: {
    host: envGetString('REDIS_URL', 'localhost'),
    port: 6379,
  },
};

// Input processor queue
export const inputProcessorQ = new Bull<TaskInputProcessorObject>('TASK_INPUT', REDIS_CONNECTION);
inputProcessorQ.process(async (job) => {
  const { task, jsonFilePath, tgzFilePath, folderPath } = job.data;
  await processInputFile(task, jsonFilePath, tgzFilePath, folderPath);
});

// Forward task link handler
export const forwardTaskLinkQ = new Bull<ForwardTaskLinkHandlerObject>('FORWARD_TASK_LINK', REDIS_CONNECTION);
forwardTaskLinkQ.process(async (job) => {
  await executeForwardTaskLinks(job.data);
});

// Backward task link handler
export const backwardTaskLinkQ = new Bull<BackwardTaskLinkHandlerObject>('BACKWARD_TASK_LINK', REDIS_CONNECTION);
backwardTaskLinkQ.process(async (job) => {
  await executeBackwardTaskLinks(job.data);
});

// Output generator
export const outputGeneratorQ = new Bull<TaskOutputGeneratorObject>('TASK_OUTPUT', REDIS_CONNECTION);
outputGeneratorQ.process(async (job) => {
  await generateTaskOutput(job.data);
});

// Task operation queues
const taskOpQueues = [inputProcessorQ, forwardTaskLinkQ, backwardTaskLinkQ, outputGeneratorQ] as const;

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
