// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Backend implementation of the sentence corpus validation chain

import { baseSentenceCorpusValidationChain, MicrotaskType } from '@karya/core';
import { BackendChainInterface } from '../BackendChainInterface';

export const sentenceCorpusValidationChain: BackendChainInterface<'SENTENCE_CORPUS', 'SENTENCE_CORPUS_VERIFICATION'> = {
  ...baseSentenceCorpusValidationChain,

  /**
   * Generate SentenceCorpus verification microtasks for completed SentenceCorpus data assignments
   */
  async handleCompletedFromAssignments(fromTask, toTask, assignments, microtasks) {
    const chainedMicrotasks = assignments.map((assignment, i) => {
      const microtask = microtasks[i];
      const chainedMicrotask: MicrotaskType<'SENTENCE_CORPUS_VERIFICATION'> = {
        task_id: toTask.id,
        input: {
          data: { prompt: microtask.input.data.prompt, sentences: assignment.output!.data.sentences },
        },
        deadline: toTask.deadline,
        credits: toTask.params.creditsPerMicrotask,
        base_credits: toTask.params.baseCreditsPerMicrotask,
        status: 'INCOMPLETE',
      };
      return chainedMicrotask;
    });
    return chainedMicrotasks;
  },

  /**
   * Handle completion of SentenceCorpus verification microtasks. Generate verification
   * updates for the corresponding assignments
   */
  async handleCompletedToMicrotasks(fromTask, toTask, microtasks, assignments) {
    const verificationUpdates = microtasks.map((microtask, i) => {
      const assignment = assignments[i];
      const report = microtask.output!.data;
      const ratings = Object.values(report.sentences);
      const score = ratings
        .map((s) => (s.status == 'VALID' ? (1 as number) : s.status == 'ERRORS' ? 0.5 : 0))
        .reduce((a, b) => a + b, 0);
      const accuracy = score / ratings.length;
      assignment.report = { ...report, accuracy };
      assignment.credits = score * fromTask.params.creditsPerMicrotask;
      return assignment;
    });
    return verificationUpdates;
  },
};
