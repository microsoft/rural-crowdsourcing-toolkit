// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Implementation of backend multi-variant transliteration verification scenario

import {
  baseMVXliterationVerificationScenario,
  BaseMVXliterationVerificationScenario,
  MicrotaskType,
} from '@karya/core';
import { IBackendScenarioInterface } from '../ScenarioInterface';

export const backendMVXliterationVerificationScenario: IBackendScenarioInterface<BaseMVXliterationVerificationScenario> = {
  ...baseMVXliterationVerificationScenario,

  /**
   * Process input json file for mv transliteration verification scenario
   */
  async processInputFile(task, jsonData, tarFilePath, taskFolder) {
    const mts: { word: string; variants: string[] }[] = jsonData!;
    const microtasks = mts.map((mt) => {
      const microtask: MicrotaskType<'MV_XLITERATION_VERIFICATION'> = {
        task_id: task.id,
        input: { data: mt },
        deadline: task.deadline,
        credits: task.params.creditsPerVerification,
        status: 'INCOMPLETE',
      };
      return microtask;
    });
    return [{ mg: null, microtasks }];
  },

  /**
   * Generate output files for transliteration verification task.
   * TODO: temporarily returning no files
   */
  async generateOutput(task, assignments, task_folder, timestamp) {
    return [];
  },

  /**
   * Microtask output
   * TODO: Temporarily returning null
   */
  async microtaskOutput(task, microtask, assignments) {
    return null;
  },
};
