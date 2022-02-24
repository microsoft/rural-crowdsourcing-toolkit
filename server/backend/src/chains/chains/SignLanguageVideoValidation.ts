// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Backend implementation of the sign language video validation chain

import { baseSignLanguageVideoValidation, MicrotaskStatus, MicrotaskType } from '@karya/core';
import { BackendChainInterface } from '../BackendChainInterface';

export const signLanguageVideoValidation: BackendChainInterface<
  'SIGN_LANGUAGE_VIDEO',
  'SGN_LANG_VIDEO_VERIFICATION'
> = {
  ...baseSignLanguageVideoValidation,

  /**
   * Generate speech verification microtasks for completed speech data assignments
   */
  async handleCompletedFromAssignments(fromTask, toTask, assignments, microtasks) {
    const chainedMicrotasks = assignments.map((assignment, i) => {
      let status: MicrotaskStatus = 'INCOMPLETE';
      if (fromTask.id != '2' && Math.random() > 0.3) {
        status = 'COMPLETED';
      }
      const microtask = microtasks[i];
      const chainedMicrotask: MicrotaskType<'SGN_LANG_VIDEO_VERIFICATION'> = {
        task_id: toTask.id,
        input: {
          data: { sentence: microtask.input.data.sentence },
          files: { recording: assignment.output!.files!.recording },
        },
        input_file_id: assignment.output_file_id,
        deadline: toTask.deadline,
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
      assignment.credits = report.score;
      assignment.report = report;
      return assignment;
    });
    return verificationUpdates;
  },
};
