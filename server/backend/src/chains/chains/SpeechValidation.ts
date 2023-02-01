// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Backend implementation of the speech validation chain

import { baseSpeechValidationChain, MicrotaskType } from '@karya/core';
import { BackendChainInterface } from '../BackendChainInterface';
import { downloadAndExtractKaryaFile } from '../../models/KaryaFileModel';
import { Promise as BBPromise } from 'bluebird';

export const speechValidationChain: BackendChainInterface<'SPEECH_DATA', 'SPEECH_VERIFICATION'> = {
  ...baseSpeechValidationChain,

  /**
   * Generate speech verification microtasks for completed speech data assignments
   */
  async handleCompletedFromAssignments(fromTask, toTask, assignments, microtasks, folder_path) {
    const chainedMicrotasks = await BBPromise.mapSeries(assignments, async (assignment, i) => {
      const microtask = microtasks[i];

      // Temporary fix for output files that may be sent as array
      const output_files = assignment.output!.files!;
      const recording = output_files.recording;

      // Check if the microtask has any input files
      const mt_input_file_id = microtask.input_file_id;
      if (mt_input_file_id != null) {
        await downloadAndExtractKaryaFile(mt_input_file_id, folder_path);
        await downloadAndExtractKaryaFile(assignment.output_file_id!, folder_path);
      }

      const chainedMicrotask: MicrotaskType<'SPEECH_VERIFICATION'> = {
        task_id: toTask.id,
        input: {
          data: microtask.input.data,
          files: mt_input_file_id != null ? { ...output_files, ...microtask.input.files } : { recording },
        },
        input_file_id: mt_input_file_id != null ? null : assignment.output_file_id,
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
      let fraction = 0;

      if (report.auto) {
        fraction = report.fraction;
      } else {
        const { accuracy, volume, quality } = report;

        if (accuracy < 2 || quality == 0 || volume == 0) {
          fraction = 0;
        } else if (volume == 1 || quality == 1) {
          fraction = 0.5;
        } else if (accuracy == 2 && quality == 2 && volume == 2) {
          fraction = 1;
        }
      }

      const credits = fraction * fromTask.params.creditsPerMicrotask;
      assignment.credits = credits;
      assignment.report = report;
      return assignment;
    });
    return verificationUpdates;
  },
};
