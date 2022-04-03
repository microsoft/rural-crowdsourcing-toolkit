// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Backend implementation of the sign langauge video data scenario

import { IBackendScenarioInterface } from '../ScenarioInterface';
import { baseSignLanguageVideoScenario, BaseSignLanguageVideoScenario, MicrotaskRecordType } from '@karya/core';
import { BasicModel } from '@karya/common';
import { Promise as BBPromise } from 'bluebird';
import { promises as fsp } from 'fs';
import { getInputFileProcessor } from '../../task-ops/ops/InputProcessor';

// Backend speech data scenario
export const backendSignLanguageVideoScenario: IBackendScenarioInterface<BaseSignLanguageVideoScenario> = {
  ...baseSignLanguageVideoScenario,

  processInputFile: getInputFileProcessor(),

  /**
   * Generate output files for sign language video task. There are two files for each
   * verified assignment. A JSON file describing the details of the assignment,
   * and a recording file. Completed microtasks do not play a role.
   */
  async generateOutput(task, assignments, microtasks, task_folder, timestamp) {
    const files: string[] = [];
    await BBPromise.mapSeries(assignments, async (assignment) => {
      // get the microtask record
      const mt = (await BasicModel.getSingle('microtask', {
        id: assignment.microtask_id,
      })) as MicrotaskRecordType<'SIGN_LANGUAGE_VIDEO'>;

      // Get the recording name
      const recordingFile = assignment.output!.files!.recording;

      // JSON data
      const jsonData = {
        sentence_id: mt.id,
        sentence: mt.input.data.sentence,
        worker_id: assignment.worker_id,
        file: recordingFile,
        report: assignment.report,
        max_credits: assignment.max_credits,
        credits: assignment.credits,
      };

      // Write the json data to file
      const jsonFile = `${assignment.id}.json`;
      await fsp.writeFile(`${task_folder}/${jsonFile}`, JSON.stringify(jsonData, null, 2) + '\n');

      // Push json and recording to files
      files.push(jsonFile);
      files.push(recordingFile);
    });

    return files;
  },

  /**
   * Sign language video microtask output
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
