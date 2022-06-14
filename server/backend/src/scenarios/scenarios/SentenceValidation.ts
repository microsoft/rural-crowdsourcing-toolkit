// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Backend implementation of the sentence validation scenario

import { IBackendScenarioInterface } from '../ScenarioInterface';
import {
  BaseSentenceValidationScenario,
  baseSentenceValidationScenario,
  MicrotaskRecordType,
  MicrotaskType,
} from '@karya/core';
import { BasicModel, knex } from '@karya/common';
import { Promise as BBPromise } from 'bluebird';
import { promises as fsp } from 'fs';

// Backend text translation scenario
export const backendSentenceValidationScenario: IBackendScenarioInterface<BaseSentenceValidationScenario> = {
  ...baseSentenceValidationScenario,

  /**
   * Process the input file for the quiz task.
   * @param task Quiz task record
   * @param jsonFilePath Path to JSON file
   * @param tarFilePath --
   * @param task_folder Task folder path
   */
  async processInputFile(task, jsonData, tarFilePath, taskFolder) {
    const mts: any[] = jsonData!!;
    const microtasks = mts.map((mtData) => {
      const mt: MicrotaskType<'SENTENCE_VALIDATION'> = {
        task_id: task.id,
        input: { data: mtData },
        deadline: task.deadline,
        credits: task.params.creditsPerMicrotask,
        status: 'INCOMPLETE',
      };
      return mt;
    });

    return [{ mg: null, microtasks }];
  },

  /**
   * Generate output for sentence corpus validation.
   *
   * TODO: output format should be made a task parameter.
   */
  async generateOutput(task, assignments, microtasks, task_folder, timestamp) {
    const allSentences = await BBPromise.mapSeries(assignments, async (assignment) => {
      // get the microtask record
      const mt = (await BasicModel.getSingle('microtask', {
        id: assignment.microtask_id,
      })) as MicrotaskRecordType<'SENTENCE_VALIDATION'>;

      return {
        sentence: mt.input.data.sentence,
        rating: assignment.output!.data!,
      };
    });

    const validSentences = allSentences.filter((s) => s.rating.grammar && s.rating.spelling);
    const rest = allSentences.filter((s) => !(s.rating.grammar && s.rating.spelling));

    const validJsonFileName = `valid-${timestamp}.json`;
    const invalidJsonFileName = `invalid-${timestamp}.json`;

    await fsp.writeFile(`${task_folder}/${validJsonFileName}`, JSON.stringify(validSentences, null, 2) + '\n');
    await fsp.writeFile(`${task_folder}/${invalidJsonFileName}`, JSON.stringify(rest, null, 2) + '\n');

    return [validJsonFileName, invalidJsonFileName];
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
    const response = await knex.raw(`
      SELECT
        COUNT(DISTINCT microtask_id) as num_sentences
      FROM
        microtask_assignment
      WHERE
        task_id = ${task_id} AND
        output::json->'data'->>'spelling'='true' AND
        output::json->'data'->>'grammar'='true' AND
        output::json->'data'->>'appropriate'='true'
    `);

    const num_sentences = response.rowCount == 0 ? 0 : response.rows[0].num_sentences;
    return { num_sentences: { name: 'Number of Valid Sentences', val: `${num_sentences}` } };
  },
};
