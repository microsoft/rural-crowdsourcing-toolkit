// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  MicrotaskGroupRecord,
  MicrotaskRecord,
} from '@karya/db';
import * as MicroTaskGroupModel from '../../../../models/MicroTaskGroupModel';
import { IPolicy } from '../../../common/PolicyInterface';
import { StorySpeechDefaultPolicyParams } from './Index';

/**
 * Assign work to the worker at a microtask granularity.
 * Not applicable for the story-speech scenario.
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
  throw new Error('Story-speech data needs group-level assignment');
};

/**
 * Return assignable stories (groups) to a worker. This default policy simply
 * retrieves all stories that have not been assigned to the user, subject to a
 * maximum number of assignments.
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
  // Extract number of recordings required for the task assignment
  const taskAssignmentParams = taskAssignment.params as StorySpeechDefaultPolicyParams;
  const numRecordings = taskAssignmentParams.numRecordings;

  // get available microtask groups
  const microtaskGroups = await MicroTaskGroupModel.getAssignableMicrotaskGroups(
    task,
    worker,
    numRecordings,
  );
  return microtaskGroups;
};
