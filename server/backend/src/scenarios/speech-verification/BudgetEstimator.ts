// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Budget estimator for the speech data verification scenario
 */

import { BudgetEstimatorResponse } from '../common/ScenarioInterface';
import { SpeechVerificationTask } from './ParamDefinitions';

export async function estimateTaskBudget(
  task: SpeechVerificationTask,
): Promise<BudgetEstimatorResponse> {
  try {
    // extract parameters
    const {
      numRecordings,
      numVerifications,
      creditsPerVerification,
    } = task.params;

    if (numRecordings === undefined) {
      return { success: false, budget: null, message: 'Invalid task' };
    }

    return {
      success: true,
      budget: numRecordings * numVerifications * creditsPerVerification,
    };
  } catch (e) {
    return {
      success: false,
      budget: null,
      message: 'Error while estimating budget',
    };
  }
}
