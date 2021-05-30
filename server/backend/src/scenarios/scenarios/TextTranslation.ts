// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Backend implementation of the text-translation scenario

import { MicrotaskList, IBackendScenarioInterface } from '../ScenarioInterface';
import { baseTextTranslationScenario, BaseTextTranslationScenario, TaskRecordType, MicrotaskType } from '@karya/core';

/**
 * Process the input file for the text translation task.
 * @param task Text translation task record
 * @param jsonFilePath Path to JSON file
 * @param tarFilePath --
 * @param task_folder Task folder path
 */
async function processInputFile(
  task: TaskRecordType<'TEXT_TRANSLATION'>,
  jsonData?: any,
  tarFilePath?: string,
  task_folder?: string
): Promise<MicrotaskList> {
  const sentences: { sentence: string }[] = jsonData!!;
  const microtasks = sentences.map((sentence) => {
    const mt: MicrotaskType<'TEXT_TRANSLATION'> = {
      task_id: task.id,
      input: { data: sentence },
      deadline: task.deadline,
      credits: task.params.creditsPerTranslation,
      status: 'INCOMPLETE',
    };
    return mt;
  });

  return [{ mg: null, microtasks }];
}

// Backend text translation scenario
export const backendTextTranslationScenario: IBackendScenarioInterface<BaseTextTranslationScenario> = {
  ...baseTextTranslationScenario,
  processInputFile,
};
