// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Handler for task output generation
 */

import { TaskRecord } from '@karya/db';
import { generateOutput } from '@karya/scenarios';

/**
 * Handler to start output file generation for a task
 */
export async function generateTaskOutput(task: TaskRecord) {
  // TODO: Temporary fix
  await generateOutput(task, '');
}
