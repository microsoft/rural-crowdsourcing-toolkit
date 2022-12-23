// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Backend implementation of the speech validation chain

import { baseSpeechTranscriptionValidationChain, MicrotaskType } from '@karya/core';
import { BackendChainInterface } from '../BackendChainInterface';

export const speechTranscriptionValidationChain: BackendChainInterface<
  'SPEECH_TRANSCRIPTION',
  'SPEECH_VERIFICATION'
> = {
  ...baseSpeechTranscriptionValidationChain,

  /**
   * Generate speech verification microtasks for completed speech data assignments
   */
  async handleCompletedFromAssignments(fromTask, toTask, assignments, microtasks) {
    const chainedMicrotasks = assignments.map((assignment, i) => {
      const microtask = microtasks[i];

      // Temporary fix for output files that may be sent as array
      const recording = microtask.input.files!.recording;

      // Hack to mark 40% of the transcriptions as completed
      const status = Math.random() < 0.4 ? 'COMPLETED' : 'INCOMPLETE';

      const chainedMicrotask: MicrotaskType<'SPEECH_VERIFICATION'> = {
        task_id: toTask.id,
        input: {
          data: { sentence: assignment.output!.data.transcription },
          files: { recording },
        },
        input_file_id: microtask.input_file_id,
        deadline: toTask.deadline,
        base_credits: toTask.params.baseCreditsPerMicrotask,
        credits: toTask.params.creditsPerMicrotask,
        status,
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
      let fraction = 0;

      if (report.auto) {
        fraction = report.fraction;
      } else {
        const { accuracy } = report;
        fraction = accuracy == 2 ? 1 : accuracy == 1 ? 0.5 : 0;
      }

      const credits = fraction * fromTask.params.creditsPerMicrotask;
      assignment.credits = credits;
      assignment.report = { ...report, accuracy: fraction };
      return assignment;
    });
    return verificationUpdates;
  },
};
