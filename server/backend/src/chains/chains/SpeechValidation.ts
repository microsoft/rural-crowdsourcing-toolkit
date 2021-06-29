// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Backend implementation of the speech validation chain

import { baseSpeechValidationChain, MicrotaskType } from '@karya/core';
import { BackendChainInterface } from '../BackendChainInterface';

export const speechValidationChain: BackendChainInterface<'SPEECH_DATA', 'SPEECH_VERIFICATION'> = {
  ...baseSpeechValidationChain,

  /**
   * Generate speech verification microtasks for completed speech data assignments
   */
  async handleCompletedFromAssignments(fromTask, toTask, assignments, microtasks) {
    const chainedMicrotasks = assignments.map((assignment, i) => {
      const microtask = microtasks[i];
      const chainedMicrotask: MicrotaskType<'SPEECH_VERIFICATION'> = {
        task_id: toTask.id,
        input: {
          data: { sentence: microtask.input.data.sentence },
          files: { recording: assignment.output!.files!.recording },
        },
        input_file_id: assignment.output_file_id,
        deadline: toTask.deadline,
        credits: toTask.params.creditsPerMicrotask,
        status: 'INCOMPLETE',
      };
      return chainedMicrotask;
    });
    return chainedMicrotasks;
  },

  /**
   * Handle completion of speech verification microtasks. Generate verification
   * updates for the corresponding assignments
   */
  async handleCompletedToMicrotasks(fromTask, toTask, microtasks, assignments) {
    const verificationUpdates = microtasks.map((microtask, i) => {
      const assignment = assignments[i];
      const report = microtask.output!.data;
      const { accuracy, volume, quality } = report;
      let score = 0;
      const sum = accuracy + quality + volume;
      if (accuracy == 0 || quality == 0 || volume == 0) {
        score = 0;
      } else if (sum == 3) {
        score = 0.25;
      } else if (sum == 4) {
        score = 0.5;
      } else if (sum == 5) {
        score = 0.75;
      } else if (sum == 6) {
        score = 1;
      }

      const credits = score * fromTask.params.creditsPerMicrotask;
      assignment.credits = credits;
      assignment.report = report;
      return assignment;
    });
    return verificationUpdates;
  },
};
