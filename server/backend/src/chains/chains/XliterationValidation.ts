// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Backend implementation of the xliteration validation chain

import { baseXliterationValidationChain, MicrotaskType } from '@karya/core';
import { BackendChainInterface } from '../BackendChainInterface';

export const xliterationValidationChain: BackendChainInterface<'MV_XLITERATION', 'MV_XLITERATION_VERIFICATION'> = {
  ...baseXliterationValidationChain,

  /**
   * Generate transliteration validation microtasks for completed
   * transliateration assignments
   */
  async handleCompletedFromAssignments(fromTask, toTask, assignments, microtasks) {
    const chainedMicrotasks = assignments.map((assignment, i) => {
      const microtask = microtasks[i];
      const chainedMicrotask: MicrotaskType<'MV_XLITERATION_VERIFICATION'> = {
        task_id: toTask.id,
        input: {
          data: {
            word: microtask.input.data.word,
            variants: assignment.output!.data.variants,
          },
        },
        deadline: toTask.deadline,
        credits: toTask.params.creditsPerVerification,
        status: 'INCOMPLETE',
      };
      return chainedMicrotask;
    });
    return chainedMicrotasks;
  },

  /**
   * Handle completion of transliteration verification microtasks. Generate
   * verification updates for the corresponding assignments
   */
  async handleCompletedToMicrotasks(fromTask, toTask, microtasks, assignments) {
    const verificatioUpdates = microtasks.map((microtask, i) => {
      const assignment = assignments[i];
      const validations = microtask.output!.data.validations;
      const sum = validations.map((v) => (v ? 1 : (0 as number))).reduce((a, b) => a + b, 0);
      const credits = sum * fromTask.params.creditsPerVariant;
      assignment.report = { validations };
      assignment.credits = credits;
      return assignment;
    });
    return verificatioUpdates;
  },
};
