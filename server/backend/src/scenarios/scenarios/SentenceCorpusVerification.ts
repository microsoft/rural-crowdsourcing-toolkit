// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Implementation of backend sentence corpus verification scenario

import {
  baseSentenceCorpusVerificationScenario,
  BaseSentenceCorpusVerificationScenario,
  MicrotaskRecordType,
  MicrotaskType,
} from '@karya/core';
import { IBackendScenarioInterface } from '../ScenarioInterface';
import { Promise as BBPromise } from 'bluebird';
import { promises as fsp } from 'fs';
import { BasicModel } from '@karya/common';

// Backend transliteration data scenario
export const backendSentenceCorpusVerificationScenario: IBackendScenarioInterface<BaseSentenceCorpusVerificationScenario> = {
  ...baseSentenceCorpusVerificationScenario,

  /**
   * Process input json file for the sentence corpus verification
   */
  async processInputFile(task, jsonData, tarFilePath, task_folder) {
    const mts: any[] = jsonData!;
    const microtasks = mts.map((mt) => {
      const microtask: MicrotaskType<'SENTENCE_CORPUS_VERIFICATION'> = {
        task_id: task.id,
        input: { data: mt },
        deadline: task.deadline,
        credits: task.params.creditsPerMicrotask,
        status: 'INCOMPLETE',
      };
      return microtask;
    });
    return [{ mg: null, microtasks }];
  },

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
};
