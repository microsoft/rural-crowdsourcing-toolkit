// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Backend implementation of the image annotation validation chain

import { baseImageAnnotationValidation, MicrotaskType } from '@karya/core';
import { BackendChainInterface } from '../BackendChainInterface';

export const imageAnnotationValidation: BackendChainInterface<'IMAGE_ANNOTATION', 'IMAGE_ANNOTATION_VALIDATION'> = {
  ...baseImageAnnotationValidation,

  /**
   * Generate image annotation validation microtasks for completed speech data assignments
   */
  async handleCompletedFromAssignments(fromTask, toTask, assignments, microtasks) {
    const chainedMicrotasks = assignments.map((assignment, i) => {
      const microtask = microtasks[i];
      const chainedMicrotask: MicrotaskType<'IMAGE_ANNOTATION_VALIDATION'> = {
        task_id: toTask.id,
        input: {
          data: assignment.output!.data,
          files: { image: microtask.input.files!.image },
        },
        input_file_id: microtask.input_file_id,
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
   * Handle completion of image annotation validation microtasks. Generate verification
   * updates for the corresponding assignments
   */
  async handleCompletedToMicrotasks(fromTask, toTask, microtasks, assignments) {
    const verificationUpdates = microtasks.map((microtask, i) => {
      const assignment = assignments[i];
      const report = microtask.output!.data;
      const ratings = report.rating;
      const scores: number[] = ratings.map((r) => (r == 'GOOD' ? 1 : r == 'OKAY' ? 0.5 : 0));
      const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      assignment.credits = toTask.params.creditsPerMicrotask * avgScore;
      assignment.report = report;
      return assignment;
    });
    return verificationUpdates;
  },
};
