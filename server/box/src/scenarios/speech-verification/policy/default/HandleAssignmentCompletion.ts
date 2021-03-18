// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Completion handlers for default policy of speech verification
 */

import * as MicrotaskModel from '../../../../models/MicroTaskModel';
import logger from '../../../../utils/Logger';
import { IPolicy } from '../../../common/PolicyInterface';
import { SpeechVerificationDefaultPolicyParams } from './Index';

/**
 * Handle microtask assignment completion
 * @param microtaskAssignment
 */
export const handleMicrotaskAssignmentCompletion: IPolicy['handleMicrotaskAssignmentCompletion'] = async (
  microtaskAssignment,
  microtask,
  taskAssignment,
) => {
  try {
    // get the number of recordings required for this task
    const taskAssignmentParams = taskAssignment.params as SpeechVerificationDefaultPolicyParams;
    const { numVerifications } = taskAssignmentParams;

    // if all microtasks for this micro task group have been complete then mark it as complete
    const completedMicroTaskAssignmentsCount = await MicrotaskModel.getCompletedAssignmentsCount(
      microtask,
    );

    if (completedMicroTaskAssignmentsCount >= numVerifications) {
      await MicrotaskModel.markComplete(microtask);
    }
  } catch (err) {
    logger.error(
      `Failed to handle microtask assignment ${
        microtaskAssignment.id
      } completion: ${err.toString()}`,
    );
  }
};

/**
 * Handle microtask group assignment completion
 * @param microtaskGroupAssignment Microtask group assignment record
 */
export const handleMicrotaskGroupAssignmentCompletion: IPolicy['handleMicrotaskGroupAssignmentCompletion'] = async (
  microtaskGroupAssignment,
  microtaskGroup,
  taskAssignment,
) => {
  throw new Error('Speech-data scenario has no groups');
};
