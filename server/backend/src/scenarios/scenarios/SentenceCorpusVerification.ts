// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Implementation of backend sentence corpus verification scenario

import { baseSentenceCorpusVerificationScenario, BaseSentenceCorpusVerificationScenario } from '@karya/core';
import { IBackendScenarioInterface } from '../ScenarioInterface';
import { getInputFileProcessor } from '../../task-ops/ops/InputProcessor';

// Backend transliteration data scenario
export const backendSentenceCorpusVerificationScenario: IBackendScenarioInterface<BaseSentenceCorpusVerificationScenario> = {
  ...baseSentenceCorpusVerificationScenario,

  processInputFile: getInputFileProcessor(),

  /**
   * Generate output files for sentence corpus verification task.
   */
  async generateOutput(task, assignments, microtasks, task_folder, timestamp) {
    return [];
  },

  /**
   * Microtask output
   * TODO: Temporarily using the output of the first assignment
   */
  async microtaskOutput(task, microtask, assignments) {
    const assignment = assignments[0];
    return assignment.output!;
  },

  async getTaskData(task_id) {
    const ob = {} as object;
    return ob;
  },
};
