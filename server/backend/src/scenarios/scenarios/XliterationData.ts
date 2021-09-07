// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Implementation of backend transliteration data scenario

import {
  baseXliterationDataScenario,
  BaseXliterationDataScenario,
  MicrotaskRecordType,
  MicrotaskType,
} from '@karya/core';
import { IBackendScenarioInterface } from '../ScenarioInterface';
import { Promise as BBPromise } from 'bluebird';
import { promises as fsp } from 'fs';
import { BasicModel } from '@karya/common';

// Backend transliteration data scenario
export const backendXliterationDataScenario: IBackendScenarioInterface<BaseXliterationDataScenario> = {
  ...baseXliterationDataScenario,

  /**
   * Process input json file for mv tranliteration scenario
   */
  async processInputFile(task, jsonData, tarFilePath, task_folder) {
    const mts: any[] = jsonData!;
    const microtasks = mts.map((mt) => {
      const microtask: MicrotaskType<'XLITERATION_DATA'> = {
        task_id: task.id,
        input: { data: mt },
        deadline: task.deadline,
        credits: task.params.creditsPerVariant * mt.limit,
        status: 'INCOMPLETE',
      };
      return microtask;
    });
    return [{ mg: null, microtasks }];
  },

  /**
   * Generate output files for transliteration task. For each verified
   * assignment, generate a json output with the source word, a list of variants
   * with whether each variant is valid.
   */
  async generateOutput(task, assignments, microtasks, task_folder, timestamp) {
    const files = await BBPromise.mapSeries(assignments, async (assignment) => {
      // get the microtask record
      const mt = (await BasicModel.getSingle('microtask', {
        id: assignment.microtask_id,
      })) as MicrotaskRecordType<'XLITERATION_DATA'>;

      // variants
      const inputVariants = mt.input.data.variants;
      const outputVariants = assignment.output!.data.variants;
      // @ts-ignore
      const reportVariants = (assignment.report?.variants as typeof inputVariants) ?? {};

      Object.entries(reportVariants).forEach(([variant, info]) => {
        if (variant in inputVariants) {
          inputVariants[variant].status = info.status;
        }
        if (variant in outputVariants) {
          outputVariants[variant].status = info.status;
        }
      });

      // JSON data
      const jsonData = {
        language: task.params.language,
        word_id: assignment.microtask_id,
        word: mt.input.data.word,
        worker_id: assignment.worker_id,
        input: inputVariants,
        output: outputVariants,
        report: reportVariants,
        variants: { ...inputVariants, ...outputVariants, ...reportVariants },
        max_credits: assignment.max_credits,
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
   * Microtask output
   * TODO: Temporarily using the output of the first assignment
   */
  async microtaskOutput(task, microtask, assignments) {
    const assignment = assignments[0];
    return assignment.output!;
  },
};
