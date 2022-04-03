// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Backend implementation of the image labelling scenario

import { BaseImageLabellingScenario, baseImageLabellingScenario } from '@karya/core';
import { IBackendScenarioInterface } from '../ScenarioInterface';
import { getInputFileProcessor } from '../../task-ops/ops/InputProcessor';

export const backendImageLabellingScenario: IBackendScenarioInterface<BaseImageLabellingScenario> = {
  ...baseImageLabellingScenario,

  processInputFile: getInputFileProcessor(['image']),

  /**
   * Generate task output for image transcription microtask
   * TODO: Temporary stub
   */
  async generateOutput(task, assignments, microtasks, task_folder, timestamp) {
    return [];
  },

  /**
   * Generate image transcription microtask output
   * TODO: Temporary stub
   */
  async microtaskOutput(task, microtask, assignments) {
    return null;
  },

  async getTaskData(task_id) {
    const ob = {} as object;
    return ob;
  },
};
