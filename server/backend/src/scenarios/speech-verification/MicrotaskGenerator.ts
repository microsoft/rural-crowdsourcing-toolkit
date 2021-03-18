// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Microtask generator for speech data verification scenario
 */

import * as BBPromise from 'bluebird';
import { Microtask, MicrotaskGroup } from '../../db/TableInterfaces.auto';
import { MicrotaskGeneratorResponse } from '../common/ScenarioInterface';
import { SpeechVerificationTask } from './ParamDefinitions';

export async function generateMicrotasks(
  task: SpeechVerificationTask,
): Promise<MicrotaskGeneratorResponse> {
  try {
    const { fromSpeechTask } = task.params;
    if (!fromSpeechTask) {
      throw new Error('Unimplemented feature');
    }
    return { success: true, microtaskGroups: [], fileMap: {} };
  } catch (e) {
    return {
      success: false,
      message: 'Unknown error while generating microtasks',
    };
  }
}
