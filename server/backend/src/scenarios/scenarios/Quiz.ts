// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Backend implementation of the text-translation scenario

import { IBackendScenarioInterface } from '../ScenarioInterface';
import { baseQuizScenario, BaseQuizScenario, MicrotaskType } from '@karya/core';
import { Promise as BBPromise } from 'bluebird';
import { promises as fsp } from 'fs';

// Backend text translation scenario
export const backendQuizScenario: IBackendScenarioInterface<BaseQuizScenario> = {
  ...baseQuizScenario,

  /**
   * Process the input file for the quiz task.
   * @param task Quiz task record
   * @param jsonFilePath Path to JSON file
   * @param tarFilePath --
   * @param task_folder Task folder path
   */
  async processInputFile(task, jsonData, tarFilePath, taskFolder) {
    const mts: any[] = jsonData!!;
    const microtasks = await BBPromise.mapSeries(mts, async ({ images, ...rest }) => {
      await BBPromise.mapSeries(images, async (image) => {
        const filePath = `${taskFolder}/${image}`;
        try {
          await fsp.access(filePath);
        } catch (e) {
          throw new Error(`Image file not present`);
        }
      });
      const mt: MicrotaskType<'QUIZ'> = {
        task_id: task.id,
        input: { data: rest, files: { images } },
        deadline: task.deadline,
        credits: task.params.creditsPerMicrotask,
        status: 'INCOMPLETE',
      };
      return mt;
    });

    return [{ mg: null, microtasks }];
  },

  /**
   * Generate output for quiz.
   *
   * TODO: output format should be made a task parameter.
   */
  async generateOutput(task, assignments, microtasks, task_folder, timestamp) {
    return [];
  },

  /**
   * Quiz microtask output
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
