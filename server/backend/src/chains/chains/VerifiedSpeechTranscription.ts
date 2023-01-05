// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Backend implementation of the verified speech transcription chain

import { baseVerifiedSpeechTranscriptionChain, MicrotaskType } from '@karya/core';
import { BackendChainInterface } from '../BackendChainInterface';

export const verifiedSpeechTranscriptionChain: BackendChainInterface<'SPEECH_VERIFICATION', 'SPEECH_TRANSCRIPTION'> = {
  ...baseVerifiedSpeechTranscriptionChain,

  /**
   * Generate speech transcription microtasks for completed verfication tasks
   */
  async handleCompletedFromAssignments(fromTask, toTask, assignments, microtasks) {
    const chainedMicrotasks = assignments.map((assignment, i) => {
      const microtask = microtasks[i];

      // Get the input sentence and recording for the verification
      const recording = microtask.input.files!.recording;

      // Get recording accuracy
      // @ts-ignore Accuracy will exist when manually validated
      const accuracy = assignment.output?.data.accuracy as number;

      const chainedMicrotask: MicrotaskType<'SPEECH_TRANSCRIPTION'> =
        accuracy == 2
          ? {
              task_id: toTask.id,
              input: {
                // @ts-ignore
                data: { ...microtask.input.data, report: assignment.output.data },
                files: { recording },
              },
              input_file_id: microtask.input_file_id,
              deadline: toTask.deadline,
              base_credits: toTask.params.baseCreditsPerMicrotask,
              credits: toTask.params.creditsPerMicrotask,
              status: 'INCOMPLETE',
            }
          : {
              task_id: toTask.id,
              input: {
                // @ts-ignore
                data: { ...microtask.input.data, report: assignment.output.data },
                files: { recording },
              },
              input_file_id: microtask.input_file_id,
              base_credits: 0.0,
              credits: 0.0,
              status: 'COMPLETED',
              output: {
                // @ts-ignore
                flag: 'Incorrect transcription',
              },
            };
      return chainedMicrotask;
    });
    return chainedMicrotasks;
  },

  /**
   * Handle completed transcriptions
   */
  async handleCompletedToMicrotasks(fromTask, toTask, microtasks, assignments) {
    const verificationUpdates = microtasks.map((microtask, i) => {
      const assignment = assignments[i];
      assignment.credits = assignment.max_credits;
      return assignment;
    });
    return verificationUpdates;
  },
};
