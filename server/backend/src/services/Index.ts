// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Definition of asynchronous background tasks.
 */

// Bull for async jobs
import Bull from 'bull';

// Db types
import { TaskRecord } from '@karya/core';

// Task action handlers
import { generateTaskOutput } from './GenerateOutput';

/** Queue and handler for task output generator */
export const taskOutputGeneratorQueue = new Bull<TaskRecord>('output_generator');

// output generator handler
taskOutputGeneratorQueue.process(async (job) => generateTaskOutput(job.data));
