// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Handler for task validation.
 */

import { taskLogger } from '../utils/Logger';

// Basic model
import * as BasicModel from '../models/BasicModel';

// Types
import { TaskRecord } from '../db/TableInterfaces.auto';
import { scenarioMap } from '../scenarios/Index';

export async function validateTask(taskRecord: TaskRecord) {
  taskLogger.info(`Request to validate task '${taskRecord.id}`);

  // Get the scenario object
  const scenarioRecord = await BasicModel.getSingle('scenario', {
    id: taskRecord.scenario_id,
  });

  // Get the scenario object
  const scenario = scenarioMap[scenarioRecord.name];

  // Validate task
  const response = await scenario.validateTask(taskRecord);

  // Validation failed
  if (response.success === false) {
    // Update the task status to invalid
    await BasicModel.updateSingle(
      'task',
      { id: taskRecord.id },
      { status: 'invalid', errors: { messages: response.message } },
    );

    return null;
  }

  // Estimate budget
  const budgetResponse = await scenario.estimateTaskBudget(taskRecord);

  const updatedRecord = await BasicModel.updateSingle(
    'task',
    { id: taskRecord.id },
    {
      status: 'validated',
      errors: {},
      actions: {},
      budget: budgetResponse.budget,
    },
  );

  return updatedRecord;
}
