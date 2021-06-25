// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Backend implementation of the xliteration validation chain

import { baseXliterationValidationChain, MicrotaskType } from '@karya/core';
import { BackendChainInterface } from '../BackendChainInterface';

export const xliterationValidationChain: BackendChainInterface<'XLITERATION_DATA', 'XLITERATION_DATA'> = {
  ...baseXliterationValidationChain,

  /**
   * Generate transliteration validation microtasks for completed
   * transliateration assignments
   */
  async handleCompletedFromAssignments(fromTask, toTask, assignments, microtasks) {
    const chainedMicrotasks = assignments.map((assignment, i) => {
      const microtask = microtasks[i];
      const chainedMicrotask: MicrotaskType<'XLITERATION_DATA'> = {
        task_id: toTask.id,
        input: {
          data: {
            word: microtask.input.data.word,
            limit: microtask.input.data.limit,
            variants: {
              ...microtask.input.data.variants,
              ...assignment.output!.data.variants,
            },
          },
        },
        deadline: toTask.deadline,
        credits: toTask.params.creditsPerValidation,
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
    const verificationUpdates = microtasks.map((microtask, i) => {
      const assignment = assignments[i];
      const variants = microtask.output!.data.variants;
      const sum = Object.values(variants)
        .map((v) => (v.status == 'VALID' ? 1 : (0 as number)))
        .reduce((a, b) => a + b, 0);
      const credits = sum * fromTask.params.creditsPerVariant;
      assignment.report = { variants };
      assignment.credits = credits;
      return assignment;
    });
    return verificationUpdates;
  },
};
