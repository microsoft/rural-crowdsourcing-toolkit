// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Specification of the story-speech scenario.
 */

import {
  MicrotaskAssignmentRecord,
  MicrotaskRecord,
  TaskRecord,
  BasicModel,
} from '@karya/db';

import { IScenario } from '../common/ScenarioInterface';
import { estimateTaskBudget } from './BudgetEstimator';
import { generateMicrotasks } from './MicrotaskGenerator';
import { StorySpeechTask, taskParams } from './ParamDefinitions';
import { defaultPolicy } from './policy/default/Index';
import { validateTask } from './TaskValidator';

export const StorySpeechScenario: IScenario = {
  name: 'story-speech',
  full_name: 'Group Speech-data Collection',
  description:
    'This task consists of a set of stories. The worker is expected to record themselves reading out each story, one sentence at a time',

  task_params: { params: taskParams },
  skills: { l1: { read: 1, speak: 1, type: 0 } },

  assignment_granularity: 'group',
  group_assignment_order: 'either',
  microtask_assignment_order: 'either',

  validateTask,
  estimateTaskBudget,
  generateMicrotasks,
  handleMicrotaskCompletion,
  handleMicrotaskAssignmentCompletion,

  enabled: true,
  synchronous_validation: true,

  policies: [defaultPolicy],
};

/**
 * Handle completion of a story speech microtask at the server
 * @param mt Completed microtask record
 * @param task Corresponding task record
 */
async function handleMicrotaskCompletion(
  mt: MicrotaskRecord,
  task: TaskRecord,
) {}

/**
 * Handle completion of a story speech microtask assignment at the server
 * @param mta Completed microtask assignment record
 * @param mt Corresponding microtask record
 * @param task Corresponding task record
 */
async function handleMicrotaskAssignmentCompletion(
  mta: MicrotaskAssignmentRecord,
  mt: MicrotaskRecord,
  task: TaskRecord,
) {
  await BasicModel.updateSingle(
    'microtask_assignment',
    { id: mta.id },
    { status: 'verified', credits: mt.credits },
  );
}

export { StorySpeechTask };
