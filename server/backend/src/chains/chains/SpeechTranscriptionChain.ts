// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Backend implementation of the speech transcription chain

import { baseSpeechTranscriptionChain, MicrotaskType } from '@karya/core';
import { BackendChainInterface } from '../BackendChainInterface';

export const speechTranscriptionChain: BackendChainInterface<'SPEECH_DATA', 'SPEECH_TRANSCRIPTION'> = {
  ...baseSpeechTranscriptionChain,

  /**
   * Generate speech verification microtasks for completed speech data assignments
   */
  async handleCompletedFromAssignments(fromTask, toTask, assignments, microtasks) {
    const chainedMicrotasks = assignments.map((assignment, i) => {
      const microtask = microtasks[i];

      // Temporary fix for output files that may be sent as array
      const recording = assignment.output!.files!.recording;

      const chainedMicrotask: MicrotaskType<'SPEECH_TRANSCRIPTION'> = {
        task_id: toTask.id,
        input: {
          data: { transcript: microtask.input.data.sentence },
          files: { recording },
        },
        input_file_id: assignment.output_file_id,
        deadline: toTask.deadline,
        base_credits: toTask.params.baseCreditsPerMicrotask,
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
      // TODO: compute word error rate?
      const credits = 0.0 * fromTask.params.creditsPerMicrotask;
      assignment.credits = credits;
      assignment.report = report;
      return assignment;
    });
    return verificationUpdates;
  },
};
