// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Handler for task output generation
 */

import { TaskRecord } from '@karya/core';
import { generateOutput } from '@karya/common';

/**
 * Handler to start output file generation for a task
 */
export async function generateTaskOutput(task: TaskRecord) {
  // TODO: Temporary fix
  await generateOutput(task, '');
}
