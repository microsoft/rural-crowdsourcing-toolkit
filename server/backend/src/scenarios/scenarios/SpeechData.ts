// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Implementation of the speech-data scenario

import { MicrotaskList, IBackendScenarioInterface } from '../ScenarioInterface';
import { baseSpeechDataScenario, BaseSpeechDataScenario, TaskRecordType, MicrotaskType } from '@karya/core';

/**
 * Process the input file for the speech data task.
 * @param task Speech data task record
 * @param jsonFilePath Path to JSON file
 * @param tarFilePath --
 * @param task_folder Task folder path
 */
async function processInputFile(
  task: TaskRecordType<'SPEECH_DATA'>,
  jsonData?: any,
  tarFilePath?: string,
  task_folder?: string
): Promise<MicrotaskList> {
  const sentences: { sentence: string }[] = jsonData!!;
  const microtasks = sentences.map((sentence) => {
    const mt: MicrotaskType<'SPEECH_DATA'> = {
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
export const backendSpeechDataScenario: IBackendScenarioInterface<BaseSpeechDataScenario> = {
  ...baseSpeechDataScenario,
  processInputFile,
};
