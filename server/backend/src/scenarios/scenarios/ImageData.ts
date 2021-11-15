// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Implementation of image data scenario

import { baseImageDataScenario, BaseImageDataScenario, MicrotaskType } from '@karya/core';
import { IBackendScenarioInterface } from '../ScenarioInterface';

export const backendImageDataScenario: IBackendScenarioInterface<BaseImageDataScenario> = {
  ...baseImageDataScenario,

  async processInputFile(task, jsonData, tarFilePath, taskFolder) {
    const mts: { count: number }[] = jsonData!;
    const microtasks = mts.map((data) => {
      const credits = task.params.creditsPerMicrotask * data.count;
      const mt: MicrotaskType<'IMAGE_DATA'> = {
        task_id: task.id,
        input: { data },
        deadline: task.deadline,
        credits,
        status: 'INCOMPLETE',
      };
      return mt;
    });
    return [{ mg: null, microtasks }];
  },

  async generateOutput(task, assignments, microtasks, taskFolder, timestamp) {
    return [];
  },

  async microtaskOutput(task, microtask, assignments) {
    return null;
  },
};
