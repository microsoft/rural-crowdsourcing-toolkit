// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Backend implementation of the sign language video verification scenario

import { BaseSignLanguageVideoVerificationScenario, baseSignLanguageVideoVerificationScenario } from '@karya/core';
import { IBackendScenarioInterface } from '../ScenarioInterface';
import { Promise as BBPromise } from 'bluebird';
import { promises as fsp } from 'fs';
import { getInputFileProcessor } from '../../task-ops/ops/InputProcessor';

export const backendSignLanguageVideoVerificationScenario: IBackendScenarioInterface<BaseSignLanguageVideoVerificationScenario> = {
  ...baseSignLanguageVideoVerificationScenario,

  processInputFile: getInputFileProcessor(['recording']),

  /**
   * Generate output for sign video verification task. A single JSON file for each
   * completed microtask that contains the source sentence, source recording
   * name and the output.
   */
  async generateOutput(task, assignments, microtasks, task_folder, timestamp) {
    const files: string[] = [];
    await BBPromise.mapSeries(microtasks, async (microtask) => {
      const jsonData = {
        verification_id: microtask.id,
        sentence: microtask.input.data.sentence,
        recording: microtask.input.files!.recording,
        report: microtask.output!.data,
      };

      // Write the json data to file
      const jsonFile = `${microtask.id}.json`;
      await fsp.writeFile(`${task_folder}/${jsonFile}`, JSON.stringify(jsonData, null, 2) + '\n');

      // Push json file
      files.push(jsonFile);
    });
    return files;
  },

  /**
   * Generate sign video verification microtask output from a list of verified
   * assignments.
   */
  async microtaskOutput(task, microtask, assignments) {
    // TODO: Make the reduction function dependent on a task parameter?

    const data = assignments
      .map((mta) => mta.output!.data)
      .reduce((value, current) => {
        return {
          score: current.score + value.score,
          remarks: `${current.remarks}\n${value.remarks}`,
        };
      });
    data.score = data.score / assignments.length;
    return { data };
  },

  async getTaskData(task_id) {
    const ob = {} as object;
    return ob;
  },
};
