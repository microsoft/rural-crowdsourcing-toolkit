// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// This file implements the box side functions for the n-unique policy.

import { BoxPolicyInterface } from '../PolicyInterface';
import { MicrotaskModel } from '@karya/common';
import { nUniqueBasePolicy, NUniquePolicyParams } from '@karya/core';

export const nUniquePolicy: BoxPolicyInterface<NUniquePolicyParams> = {
  ...nUniqueBasePolicy,

  /**
   * Return a list of assignable microtasks to the worker from a task. For the
   * n-unique policy, a microtask is assignable to a user if it satisfies the
   * following conditions.
   *
   * 1) It is not completed.
   * 2) It has not already been assigned to the user.
   * 3) It has fewer than max assignments that have not been expired or skipped.
   */
  async assignableMicrotasks(worker, task, params) {
    const microtasks = await MicrotaskModel.getAssignableMicrotasks(task, worker, params.max);
    return microtasks;
  },

  /**
   * Unique policy cannot reconcile with groups
   */
  async assignableMicrotaskGroups(worker, task, params) {
    throw new Error('Unique policy cannot be assigned in groups');
  },

  /**
   * Handle completion of a assignment. Mark the microtask as complete if it has
   * n unique responses.
   */
  async handleAssignmentCompletion(assignment, params) {
    const count = await MicrotaskModel.uniqueResponseCount(assignment.microtask_id);
    if (count >= params.n) {
      await MicrotaskModel.markComplete(assignment.microtask_id);
    }
  },
};
