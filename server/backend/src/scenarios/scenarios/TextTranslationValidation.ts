// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Backend implementation of the text-translation validation scenario

import { MicrotaskList, IBackendScenarioInterface } from '../ScenarioInterface';
import {
  baseTextTranslationValidationScenario,
  BaseTextTranslationValidationScenario,
  TaskRecordType,
  MicrotaskType,
  MicrotaskRecordType,
} from '@karya/core';
import { Promise as BBPromise } from 'bluebird';
import { promises as fsp } from 'fs';
import { BasicModel } from '@karya/common';

/**
 * Process the input file for the text translation validation task.
 * @param task Text translation validation task record
 * @param jsonFilePath Path to JSON file
 * @param tarFilePath --
 * @param task_folder Task folder path
 */
async function processInputFile(
  task: TaskRecordType<'TEXT_TRANSLATION_VALIDATION'>,
  jsonData?: any,
  tarFilePath?: string,
  task_folder?: string
): Promise<MicrotaskList<'TEXT_TRANSLATION_VALIDATION'>> {
  const sentences: { source: string; target: string }[] = jsonData!!;
  console.log(jsonData);
  const microtasks = sentences.map((sentencePair) => {
    const mt: MicrotaskType<'TEXT_TRANSLATION_VALIDATION'> = {
      task_id: task.id,
      input: { data: sentencePair },
      deadline: task.deadline,
      credits: task.params.creditsPerMicrotask,
      status: 'INCOMPLETE',
    };
    return mt;
  });

  return [{ mg: null, microtasks }];
}

// Backend text translation validation scenario
export const backendTextTranslationValidationScenario: IBackendScenarioInterface<BaseTextTranslationValidationScenario> = {
  ...baseTextTranslationValidationScenario,
  processInputFile,

  /**
   * Generate output for text translation validation. For each verified assignment,
   * generate JSON with the source sentence, translated sentence, score and
   * verification report.
   *
   * TODO: output format should be made a task parameter.
   */
  async generateOutput(task, assignments, microtasks, task_folder, timestamp) {
    const files = await BBPromise.mapSeries(assignments, async (assignment) => {
      // Get the microtask record
      const mt = (await BasicModel.getSingle('microtask', {
        id: assignment.microtask_id,
      })) as MicrotaskRecordType<'TEXT_TRANSLATION'>;

      // Generate JSON data
      const jsonData = {
        source: mt.input.data.sentence,
        score: assignment.output!.data.score,
        worker_id: assignment.worker_id,
        report: assignment.report,
        credits: assignment.credits,
      };

      // Write the json data to file
      const jsonFile = `${assignment.id}.json`;
      await fsp.writeFile(`${task_folder}/${jsonFile}`, JSON.stringify(jsonData, null, 2) + '\n');

      return jsonFile;
    });

    return files;
  },

  /**
   * Text translation validation microtask output
   * TODO: Temporarily returning null, as microtask output can be generated
   * directly from the task level output and is typically not necessary for
   * chaining.
   */
  async microtaskOutput(task, microtask, assignments) {
    return null;
  },

  async getTaskData(task_id) {
    const ob = {} as object;
    return ob;
  },
};
