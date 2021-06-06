// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Implementation of the n-unique policy

import { MicrotaskModel } from '@karya/common';
import { MicrotaskRecordType, nUniqueBasePolicy } from '@karya/core';
import { BackendPolicyInterface } from './BackendPolicyInterface';
import { Promise as BBPromise } from 'bluebird';

export const nUniqueBackendPolicy: BackendPolicyInterface<'N_UNIQUE'> = {
  ...nUniqueBasePolicy,

  /**
   * Handler for newly completed assignments of n-unique policy. All completed
   * assignments can be marked as verified.
   * TODO: Penalty for multiple users giving the same response?
   * TODO: Penalty for the same user giving the same response?
   * TODO: Mark the unique responses as the output of the microtask?
   */
  async verify(assignments, microtasks, task) {
    const completedMicrotasks: MicrotaskRecordType[] = [];

    await BBPromise.mapSeries(microtasks, async (microtask) => {
      const count = await MicrotaskModel.uniqueResponseCount(microtask.id);
      if (count >= task.params.n) {
        completedMicrotasks.push(microtask);
      }
    });

    return [assignments, completedMicrotasks];
  },
};
