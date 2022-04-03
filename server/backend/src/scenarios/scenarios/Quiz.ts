// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Backend implementation of the text-translation scenario

import { IBackendScenarioInterface } from '../ScenarioInterface';
import { baseQuizScenario, BaseQuizScenario } from '@karya/core';
import { getInputFileProcessor } from '../../task-ops/ops/InputProcessor';

// Backend text translation scenario
export const backendQuizScenario: IBackendScenarioInterface<BaseQuizScenario> = {
  ...baseQuizScenario,

  processInputFile: getInputFileProcessor(),

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
