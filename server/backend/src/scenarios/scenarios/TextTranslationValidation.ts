// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Backend implementation of the text-translation validation scenario

import { IBackendScenarioInterface } from '../ScenarioInterface';
import {
  baseTextTranslationValidationScenario,
  BaseTextTranslationValidationScenario,
  MicrotaskRecordType,
} from '@karya/core';
import { Promise as BBPromise } from 'bluebird';
import { promises as fsp } from 'fs';
import { BasicModel } from '@karya/common';
import { getInputFileProcessor } from '../../task-ops/ops/InputProcessor';

// Backend text translation validation scenario
export const backendTextTranslationValidationScenario: IBackendScenarioInterface<BaseTextTranslationValidationScenario> = {
  ...baseTextTranslationValidationScenario,

  processInputFile: getInputFileProcessor(),

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
