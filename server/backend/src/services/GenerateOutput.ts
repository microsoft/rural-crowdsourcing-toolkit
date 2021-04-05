// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Handler for task output generation
 */

import { TaskRecord } from '@karya/db';
import { scenarioById } from '../scenarios/Index';

/**
 * Handler to start output file generation for a task
 */
export async function generateTaskOutput(task: TaskRecord) {
  /** Get the scenario */
  const scenarioObj = scenarioById[Number.parseInt(task.scenario_id, 10)];

  /** Call the relevant output generator */
  if (scenarioObj.outputGenerator) {
    await scenarioObj.outputGenerator(task);
  }
}
