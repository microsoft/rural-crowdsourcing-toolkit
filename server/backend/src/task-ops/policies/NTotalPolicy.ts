// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Implementation of the n-total policy

import { MicrotaskModel } from '@karya/common';
import { MicrotaskRecordType, nTotalBasePolicy } from '@karya/core';
import { BackendPolicyInterface } from './BackendPolicyInterface';
import { Promise as BBPromise } from 'bluebird';

export const nTotalBackendPolicy: BackendPolicyInterface<'N_TOTAL'> = {
  ...nTotalBasePolicy,

  /**
   * Handler for newly completed assignments for the n-total policy. Under this
   * policy, all completed assignments can be marked as verified regardless of
   * the output of other microtasks. A microtask can be marked complete if it
   * has sufficient number of completed assignments.
   */
  async verify(assignments, microtasks, task) {
    const completedMicrotasks: MicrotaskRecordType[] = [];

    await BBPromise.mapSeries(microtasks, async (microtask) => {
      const completedCount = await MicrotaskModel.getCompletedAssignmentsCount(microtask.id);
      if (completedCount >= task.params.n) {
        completedMicrotasks.push(microtask);
      }
    });

    return [assignments, completedMicrotasks];
  },
};
