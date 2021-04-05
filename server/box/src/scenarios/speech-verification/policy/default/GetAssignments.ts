// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Get assignments implementation for default policy of speech verification
 */

import {
  MicrotaskGroupRecord,
  MicrotaskRecord,
} from '@karya/db';
import * as MicroTaskModel from '../../../../models/MicroTaskModel';
import { IPolicy } from '../../../common/PolicyInterface';
import { SpeechVerificationDefaultPolicyParams } from './Index';

/**
 * Assign work to the worker at a microtask granularity.
 * @param worker Worker record
 * @param task Task record
 * @param taskAssignment Task assignment record
 * @param policy Policy record
 */
export const getAssignableMicrotasks: IPolicy['getAssignableMicrotasks'] = async (
  worker,
  task,
  taskAssignment,
  policy,
): Promise<MicrotaskRecord[]> => {
  const taskAssignmentParams = taskAssignment.params as SpeechVerificationDefaultPolicyParams;
  const { numVerifications } = taskAssignmentParams;

  // get available microtasks
  const microtasks = await MicroTaskModel.getAssignableMicrotasks(
    task,
    worker,
    numVerifications,
  );
  return microtasks;
};

/**
 * Return assignable stories (groups) to a worker. Not applicable to the speech
 * data scenario.
 * @param worker Worker record
 * @param task Task record
 * @param taskAssignment Task assignment record
 * @param policy Policy record
 */
export const getAssignableMicrotaskGroups: IPolicy['getAssignableMicrotaskGroups'] = async (
  worker,
  task,
  taskAssignment,
  policy,
): Promise<MicrotaskGroupRecord[]> => {
  throw new Error('Speech-data scenario performs microtask level assignments');
};
