// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// This file implements the n-total policy. This policy assigns a microtask to n
// workers, and if necessary additional workers, until there are a total of n
// completed assignments for the microtask.

import Joi from 'joi';
import { PolicyInterface } from '../PolicyInterface';
import { MicrotaskGroupModel, MicrotaskModel } from '@karya/db';

export type NTotalPolicyParams = {
  nTotal: number;
};

export const nTotalPolicy: PolicyInterface<NTotalPolicyParams> = {
  name: 'n-total',
  full_name: 'n Total Responses',

  // Policy parameters
  params: Joi.object({
    nTotal: Joi.number()
      .integer()
      .min(1)
      .label('Total number of responses')
      .description('Number of completed responses before which a microtask is deemed complete')
      .required(),
  }),

  /**
   * Return a list of assignable microtasks to the worker from a task
   */
  async assignableMicrotasks(worker, task, params) {
    const microtasks = await MicrotaskModel.getAssignableMicrotasks(task, worker, params.nTotal);
    return microtasks;
  },

  /**
   * Return a list of assignable microtask groups to the worker from a task
   */
  async assignableMicrotaskGroups(worker, task, params) {
    const groups = await MicrotaskGroupModel.getAssignableMicrotaskGroups(task, worker, params.nTotal);
    return groups;
  },

  /**
   * Handle completion of a assignment.
   */
  async handleAssignmentCompletion(assignment, params) {
    const completionCount = await MicrotaskModel.getCompletedAssignmentsCount(assignment.microtask_id);
    if (completionCount > params.nTotal) {
      await MicrotaskModel.markComplete(assignment.microtask_id);
    }
  },
};
