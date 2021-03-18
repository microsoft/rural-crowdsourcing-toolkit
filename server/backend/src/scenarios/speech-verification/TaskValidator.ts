// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Task validator for the speech verification scenario
 */

import { TaskValidatorResponse } from '../common/ScenarioInterface';
import { SpeechVerificationTask } from './ParamDefinitions';

export async function validateTask(
  task: SpeechVerificationTask,
): Promise<TaskValidatorResponse> {
  try {
    // extract parameters
    const {
      fromSpeechTask,
      speechTaskId,
      numRecordings,
      speechDataSet,
    } = task.params;

    if (fromSpeechTask) {
      if (speechTaskId === undefined || numRecordings === undefined) {
        return {
          success: false,
          message: [
            'Speech task ID or the number of recordings is not specified',
          ],
        };
      }
    } else {
      // TODO: handle direct speech verification tasks
      if (speechDataSet === undefined) {
        return {
          success: false,
          message: ['Speech data set needs to be uploaded'],
        };
      }
    }
    return { success: true };
  } catch (e) {
    return { success: false, message: ['Error reading recordings folder'] };
  }
}
