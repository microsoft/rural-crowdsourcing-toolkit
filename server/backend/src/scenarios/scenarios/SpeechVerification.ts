// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Backend implementation of the speech-verification scenario

import { IBackendScenarioInterface } from '../ScenarioInterface';
import { baseSpeechVerificationScenario, BaseSpeechVerificationScenario } from '@karya/core';
import { Promise as BBPromise } from 'bluebird';
import { promises as fsp } from 'fs';
import { getInputFileProcessor } from '../../task-ops/ops/InputProcessor';

// Backend speech verification scenario
export const backendSpeechVerificationScenario: IBackendScenarioInterface<BaseSpeechVerificationScenario> = {
  ...baseSpeechVerificationScenario,
  processInputFile: getInputFileProcessor(['recording']),

  /**
   * Generate output for speech verification task. A single JSON file for each
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
   * Generate speech verification microtaks output from a list of verified
   * assignments.
   * TODO: Temporarily return just the average. Does not work well with the
   * speech validation
   */
  async microtaskOutput(task, microtask, assignments) {
    // TODO: Make the reduction function dependent on a task parameter?

    const data = assignments
      .map((mta) => mta.output!.data)
      .reduce((value, current) => {
        if (!current.auto && !value.auto) {
          return {
            auto: false,
            accuracy: current.accuracy + value.accuracy,
            quality: current.quality + value.quality,
            volume: current.volume + value.volume,
          };
        } else if (current.auto && value.auto) {
          return {
            auto: true,
            fraction: value.fraction,
            score: current.score + value.score,
          };
        } else {
          return value;
        }
      });
    return { data };
  },

  async getTaskData(task_id) {
    const ob = {} as object;
    return ob;
  },
};
