// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Specification of the speech-verification scenario
 */

import { IScenario } from '../common/ScenarioInterface';
import { estimateTaskBudget } from './BudgetEstimator';
import { generateMicrotasks } from './MicrotaskGenerator';
import { SpeechVerificationTask, taskParams } from './ParamDefinitions';
import { defaultPolicy } from './policy/default/Index';
import { validateTask } from './TaskValidator';
import {
  MicrotaskAssignmentRecord,
  MicrotaskRecord,
  BasicModel,
} from '@karya/db';

export const SpeechVerificationScenario: IScenario = {
  name: 'speech-verification',
  full_name: 'Verification of Speech Data Recordings',
  description:
    'This task consists of a set of recordings. The worker is expected to verify the given recording and text.',

  task_params: { params: taskParams },
  skills: { l1: { read: 10, speak: 0, type: 0 } },

  assignment_granularity: 'group',
  group_assignment_order: 'either',
  microtask_assignment_order: 'sequential',

  validateTask,
  estimateTaskBudget,
  generateMicrotasks,
  handleMicrotaskCompletion,
  handleMicrotaskAssignmentCompletion,

  enabled: false,
  synchronous_validation: false,

  policies: [defaultPolicy],
};

/**
 * Handle completion of a speech verification microtask at the server
 * @param mt Completed microtask record
 * @param task Corresponding task record
 */
async function handleMicrotaskCompletion(
  mt: MicrotaskRecord,
  task: SpeechVerificationTask,
) {
  // If not verification for data collection, return
  if (!task.params.fromSpeechTask) return;

  // When speech verification is completed, compute verification score and
  // update the corresponding assignment
  const report = mt.output as {
    accuracy: number;
    quality: number;
    volume: number;
  };
  const { accuracy, quality, volume } = report;

  let score = 0;
  const sum = accuracy + quality + volume;
  if (accuracy == 0 || quality == 0 || volume == 0) {
    score = 0;
  } else if (sum == 3) {
    score = 0.25;
  } else if (sum == 4) {
    score = 0.5;
  } else if (sum == 5) {
    score = 0.75;
  } else if (sum == 6) {
    score = 1;
  }

  // Get the assignment from the input
  // @ts-ignore
  const { assignment, max_credits } = mt.input;
  await BasicModel.updateSingle(
    'microtask_assignment',
    { id: assignment },
    { status: 'verified', credits: max_credits * score, params: { report } },
  );
}

/**
 * Handle completion of a speech verification microtask assignment at the server
 * @param mta Completed microtask assignment record
 * @param mt Corresponding microtask record
 * @param task Corresponding task record
 */
async function handleMicrotaskAssignmentCompletion(
  mta: MicrotaskAssignmentRecord,
  mt: MicrotaskRecord,
  task: SpeechVerificationTask,
) {
  // TODO: only expert verification supported now
  // Mark microtask assignment as verified
  await BasicModel.updateSingle(
    'microtask_assignment',
    { id: mta.id },
    { status: 'verified', credits: mt.credits },
  );

  // Mark microtask as completed
  // @ts-ignore
  mt.output = mta.output.data;
  await BasicModel.updateSingle(
    'microtask',
    { id: mt.id },
    { output: mt.output },
  );

  // Handle microtask completion
  await handleMicrotaskCompletion(mt, task);
}

export { SpeechVerificationTask };
