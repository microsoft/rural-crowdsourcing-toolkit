// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Backend implementation of the sign langauge video data scenario

import { MicrotaskList, IBackendScenarioInterface } from '../ScenarioInterface';
import {
  Microtask,
  SignLanguageVideoTaskRecord,
  baseSignLanguageVideoScenario,
  BaseSignLanguageVideoScenario,
} from '@karya/core';

/**
 * Process the input file for the speech data task.
 * @param task Speech data task record
 * @param jsonFilePath Path to JSON file
 * @param tarFilePath --
 * @param task_folder Task folder path
 */
async function processInputFile(
  task: SignLanguageVideoTaskRecord,
  jsonData?: any,
  tarFilePath?: string,
  task_folder?: string
): Promise<MicrotaskList> {
  const sentences: { sentence: string }[] = jsonData!!;
  const microtasks = sentences.map((sentence) => {
    const mt: Microtask = {
      task_id: task.id,
      input: { data: sentence },
      deadline: task.deadline,
      credits: task.params.creditsPerRecording,
      status: 'INCOMPLETE',
    };
    return mt;
  });

  return [{ mg: null, microtasks }];
}

// Backend speech data scenario
export const backendSignLanguageVideoScenario: IBackendScenarioInterface<BaseSignLanguageVideoScenario> = {
  ...baseSignLanguageVideoScenario,
  processInputFile,
};
