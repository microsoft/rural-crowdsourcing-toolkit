// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// This file implements the box side functions for the n-matching policy.

import { BoxPolicyInterface } from '../PolicyInterface';
import { MicrotaskModel } from '@karya/common';
import { nMatchingBasePolicy, NMatchingPolicyParams } from '@karya/core';

export const nMatchingPolicy: BoxPolicyInterface<'N_MATCHING', NMatchingPolicyParams> = {
  ...nMatchingBasePolicy,

  /**
   * Return a list of assignable microtasks to the worker from a task. For the
   * n-matching policy, a microtask is assignable to a user if it satisfies the
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
   * Matching policy cannot reconcile with groups
   */
  async assignableMicrotaskGroups(worker, task, params) {
    throw new Error('Matching policy cannot be assigned in groups');
  },

  /**
   * Handle completion of a assignment. Mark the microtask as complete if it has
   * n matching responses.
   */
  async handleAssignmentCompletion(assignment, params) {
    const count = await MicrotaskModel.matchingResponseCount(assignment.microtask_id);
    if (count >= params.n) {
      await MicrotaskModel.markComplete(assignment.microtask_id);
    }
  },
};
