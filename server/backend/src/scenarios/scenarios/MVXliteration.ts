// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Implementation of backend multi-variant transliteration scenario

import { baseMVXliterationScenario, BaseMVXliterationScenario, MicrotaskRecordType, MicrotaskType } from '@karya/core';
import { IBackendScenarioInterface } from '../ScenarioInterface';
import { Promise as BBPromise } from 'bluebird';
import { promises as fsp } from 'fs';
import { BasicModel } from '@karya/common';

// Multi-variant transliteration scenario
export const backendMVXliterationScenario: IBackendScenarioInterface<BaseMVXliterationScenario> = {
  ...baseMVXliterationScenario,

  /**
   * Process input json file for mv tranliteration scenario
   */
  async processInputFile(task, jsonData, tarFilePath, task_folder) {
    const mts: { word: string; limit: number }[] = jsonData!;
    const microtasks = mts.map((mt) => {
      const microtask: MicrotaskType<'MV_XLITERATION'> = {
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
      })) as MicrotaskRecordType<'MV_XLITERATION'>;

      // variants
      const variants: string[] = assignment.output!.data.variants;
      // @ts-ignore
      const validations: boolean[] = assignment.report!.validations;

      // JSON data
      const jsonData = {
        word_id: assignment.microtask_id,
        word: mt.input.data.word,
        worker_id: assignment.worker_id,
        variants: variants.map((variant, i) => [variant, validations[i]]),
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
   * Tranliteration microtask output.
   * TODO: Temporarily returning null.
   */
  async microtaskOutput(task, microtask, assignments) {
    return null;
  },
};
