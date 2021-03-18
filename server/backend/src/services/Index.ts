// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Definition of asynchronous background tasks.
 */

// Bull for async jobs
import * as Bull from 'bull';

// Db types
import {
  LanguageRecord,
  LanguageResourceRecord,
  TaskRecord,
} from '../db/TableInterfaces.auto';

// Basic model
import * as BasicModel from '../models/BasicModel';

// Task action handlers
import { approveTask } from './ApproveTask';
import { validateTask } from './ValidateTask';

// Language resesource tarball creation handlers
import {
  createLanguageLRVTarBall,
  createLanguageResourceLRVTarBall,
} from './CreateLRVTarBall';

// logger
import logger from '../utils/Logger';
import { generateTaskOutput } from './GenerateOutput';

/** Queue and handlers for task validation */

// Task validation queue
export const taskValidationQueue = new Bull<TaskRecord>('validate_task');

// Task validation handler
taskValidationQueue.process(async job => validateTask(job.data));

// on failure, set status to invalid
taskValidationQueue.on('failed', async job => {
  const task = job.data;
  const errors = [job.failedReason || 'Task validation failed'];
  await BasicModel.updateSingle(
    'task',
    { id: task.id },
    { status: 'invalid', errors: { messages: errors } },
  );
});

/** Queue and handlers for task approval */

// Task approval queue
export const taskApprovalQueue = new Bull<TaskRecord>('approve_task');

// Task approval handler
taskApprovalQueue.process(async job => approveTask(job.data));

// On complete, set task status to 'approved'
taskApprovalQueue.on('completed', async job => {
  const task = job.data;

  await BasicModel.updateSingle(
    'task',
    { id: task.id },
    { status: 'approved', errors: {}, actions: {} },
  );
});

// On failure, reset task to 'validated'. This is a hack to enable approval
// retry.
taskApprovalQueue.on('failed', async job => {
  const task = job.data;
  const errors = [job.failedReason || 'Task approval failed'];
  await BasicModel.updateSingle(
    'task',
    { id: task.id },
    { status: 'validated', errors: { messages: errors } },
  );
});

/** Queue and handler for task output generator */
export const taskOutputGeneratorQueue = new Bull<TaskRecord>(
  'output_generator',
);

// output generator handler
taskOutputGeneratorQueue.process(async job => generateTaskOutput(job.data));

/** Queue and handlers for language LRV tarball creation */

// Language tarball creation queue
export const languageLRVTarQueue = new Bull<LanguageRecord>('create_l_lrv');

// Language lrv tar creation handler
languageLRVTarQueue.process(async job => createLanguageLRVTarBall(job.data));

// On completion, log success and reset update_lrv flag
languageLRVTarQueue.on('completed', async job => {
  const language = job.data;
  await BasicModel.updateSingle(
    'language',
    { id: language.id },
    { update_lrv_file: false },
  );
  logger.info(
    `Created LRV tarball for language '${job.data.name}' (${job.data.id})`,
  );
});

// On failure, just log error
languageLRVTarQueue.on('failed', async job => {
  const language = job.data;
  await BasicModel.updateSingle(
    'language',
    { id: language.id },
    { update_lrv_file: false },
  );
  logger.error(
    `Failed to create LRV tarball for language '${job.data.name}' (${job.data.id})`,
  );
});

/** Queue and handlers for language LRV tarball creation */

// Language tarball creation queue
export const lrLRVTarQueue = new Bull<LanguageResourceRecord>('create_lr_lrv');

// Language lrv tar creation handler
lrLRVTarQueue.process(async job => createLanguageResourceLRVTarBall(job.data));

// On completion, log success and update reset the update_lrv flag
lrLRVTarQueue.on('completed', async job => {
  const lrr = job.data;
  await BasicModel.updateSingle(
    'language_resource',
    { id: lrr.id },
    { update_lrv_file: false },
  );
  logger.info(
    `Created LRV tarball for language '${job.data.name}' (${job.data.id})`,
  );
});

// On failure, just log error
lrLRVTarQueue.on('failed', async job => {
  const lrr = job.data;
  await BasicModel.updateSingle(
    'language_resource',
    { id: lrr.id },
    { update_lrv_file: false },
  );
  logger.error(
    `Failed to create LRV tarball for language '${job.data.name}' (${job.data.id})`,
  );
});
