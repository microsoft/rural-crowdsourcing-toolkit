// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// This file implements the n-total policy. This policy assigns a microtask to n
// workers, and if necessary additional workers, until there are a total of n
// completed assignments for the microtask.

import { BoxPolicyInterface } from '../PolicyInterface';
import { MicrotaskGroupModel, MicrotaskModel } from '@karya/common';
import { nTotalBasePolicy, NTotalPolicyParams } from '@karya/core';

export const nTotalPolicy: BoxPolicyInterface<'N_TOTAL', NTotalPolicyParams> = {
  ...nTotalBasePolicy,

  /**
   * Return a list of assignable microtasks to the worker from a task
   */
  async assignableMicrotasks(worker, task, params) {
    const microtasks = await MicrotaskModel.getAssignableMicrotasks(task, worker, params.n);
    return microtasks;
  },

  /**
   * Return a list of assignable microtask groups to the worker from a task
   */
  async assignableMicrotaskGroups(worker, task, params) {
    const groups = await MicrotaskGroupModel.getAssignableMicrotaskGroups(task, worker, params.n);
    return groups;
  },

  /**
   * Handle completion of a assignment.
   */
  async handleAssignmentCompletion(assignment, params) {
    const completionCount = await MicrotaskModel.getCompletedAssignmentsCount(assignment.microtask_id);
    if (completionCount > params.n) {
      await MicrotaskModel.markComplete(assignment.microtask_id);
    }
  },
};
