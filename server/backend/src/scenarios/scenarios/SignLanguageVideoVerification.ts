// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Backend implementation of the sign language video verification scenario

import {
  BaseSignLanguageVideoVerificationScenario,
  baseSignLanguageVideoVerificationScenario,
  MicrotaskType,
} from '@karya/core';
import { IBackendScenarioInterface } from '../ScenarioInterface';
import { Promise as BBPromise } from 'bluebird';
import { promises as fsp } from 'fs';

export const backendSignLanguageVideoVerificationScenario: IBackendScenarioInterface<BaseSignLanguageVideoVerificationScenario> = {
  ...baseSignLanguageVideoVerificationScenario,

  /** Process input files */
  async processInputFile(task, jsonData, tarFilePath, taskFolder) {
    // Get all the objects from the json Data
    const verifications: { sentence: string; recording: string }[] = jsonData!;

    // Extract the microtasks
    const microtasks = await BBPromise.mapSeries(verifications, async ({ sentence, recording }) => {
      const filePath = `${taskFolder}/${recording}`;
      try {
        await fsp.access(filePath);

        const microtask: MicrotaskType<'SGN_LANG_VIDEO_VERIFICATION'> = {
          task_id: task.id,
          input: {
            data: { sentence },
            files: { recording },
          },
          deadline: task.deadline,
          credits: task.params.creditsPerMicrotask,
          status: 'INCOMPLETE',
        };

        return microtask;
      } catch (e) {
        throw new Error(`Recording file not present`);
      }
    });

    return [{ mg: null, microtasks }];
  },

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
