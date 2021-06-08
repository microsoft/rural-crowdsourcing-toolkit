// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Implementation of the n-matching policy

import { BasicModel, MicrotaskModel } from '@karya/common';
import { AssignmentRecordType, MicrotaskRecordType, nMatchingBasePolicy } from '@karya/core';
import { BackendPolicyInterface } from './BackendPolicyInterface';
import { Promise as BBPromise } from 'bluebird';

export const nMatchingBackendPolicy: BackendPolicyInterface<'N_MATCHING'> = {
  ...nMatchingBasePolicy,

  /**
   * Handler for newly completed assignments of n-matching policy. All completed
   * assignments corresponding to completed microtasks can be marked as
   * verified.
   * TODO: Penalty for providing the non-matching response?
   * TODO: Mark the matching response as the output of the microtask
   */
  async verify(assignments, microtasks, task) {
    const completedMicrotasks: MicrotaskRecordType[] = [];

    await BBPromise.mapSeries(microtasks, async (microtask) => {
      const count = await MicrotaskModel.matchingResponseCount(microtask.id);
      if (count >= task.params.n) {
        completedMicrotasks.push(microtask);
      }
    });

    const microtask_ids = completedMicrotasks.map((m) => m.id);
    const verifiedAssignments = (await BasicModel.getRecords('microtask_assignment', {}, [
      ['microtask_id', microtask_ids],
    ])) as AssignmentRecordType[];

    return [verifiedAssignments, completedMicrotasks];
  },
};
