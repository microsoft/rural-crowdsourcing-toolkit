// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Implementation of the speech-data scenario

import { MicrotaskList, IBackendScenarioInterface } from '../ScenarioInterface';
import {
  baseSpeechDataScenario,
  BaseSpeechDataScenario,
  TaskRecordType,
  MicrotaskType,
  MicrotaskRecordType,
} from '@karya/core';
import { Promise as BBPromise } from 'bluebird';
import { BasicModel, knex } from '@karya/common';
import { promises as fsp } from 'fs';

/**
 * Process the input file for the speech data task.
 * @param task Speech data task record
 * @param jsonFilePath Path to JSON file
 * @param tarFilePath --
 * @param task_folder Task folder path
 */
async function processInputFile(
  task: TaskRecordType<'SPEECH_DATA'>,
  jsonData?: any,
  tarFilePath?: string,
  task_folder?: string
): Promise<MicrotaskList<'SPEECH_DATA'>> {
  const sentences: { sentence: string; hint?: string }[] = jsonData!;
  const microtasks = sentences.map((sentence) => {
    const files = sentence.hint ? { files: { hint: sentence.hint } } : {};
    const mt: MicrotaskType<'SPEECH_DATA'> = {
      task_id: task.id,
      input: { data: { sentence: sentence.sentence }, ...files },
      deadline: task.deadline,
      credits: task.params.creditsPerMicrotask,
      status: 'INCOMPLETE',
    };
    return mt;
  });

  return [{ mg: null, microtasks }];
}

// Backend speech data scenario
export const backendSpeechDataScenario: IBackendScenarioInterface<BaseSpeechDataScenario> = {
  ...baseSpeechDataScenario,
  processInputFile,

  /**
   * Generate output files for speech data task. There are two files for each
   * verified assignment. A JSON file describing the details of the assignment,
   * and a recording file. Completed microtasks do not play a role.
   */
  async generateOutput(task, assignments, microtasks, task_folder, timestamp) {
    const files: string[] = [];
    await BBPromise.mapSeries(assignments, async (assignment) => {
      // get the microtask record
      const mt = (await BasicModel.getSingle('microtask', {
        id: assignment.microtask_id,
      })) as MicrotaskRecordType<'SPEECH_DATA'>;

      // Get the recording name
      const assFiles = assignment.output!.files!;
      const recordingFile = assFiles.recording || Object.values(assFiles)[0];

      // JSON data
      const jsonData: { [id: string]: any } = {
        sentence_id: mt.id,
        sentence: mt.input.data.sentence,
        worker_id: assignment.worker_id,
        recording: recordingFile,
        report: assignment.report,
        max_credits: assignment.max_credits,
        credits: assignment.credits,
        assigned_at: assignment.created_at,
        completed_at: assignment.completed_at,
        submitted_at: assignment.submitted_to_box_at,
        verified_at: assignment.verified_at,
      };

      // Add logs to the output
      if (task.params.includeLogs) {
        jsonData.logs = assignment.logs;
      }

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
   * Speech data microtask output
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
        SUM(COALESCE(output::json->'data'->>'duration', '0.0')::float) as no_of_sec
      FROM
        microtask_assignment
      WHERE
        task_id = ${task_id}
      GROUP BY task_id
    `);
    if (response.rowCount == 0) {
      const data = { no_of_sec: { name: 'Amount of Data', val: '0 s' } } as object;
      return data;
    } else {
      const t = response.rows[0].no_of_sec;
      const h = Math.floor(t / 3600).toString() + 'h ';
      const m = Math.floor((t % 3600) / 60).toString() + 'm ';
      const s = Math.floor((t % 3600) % 60).toString() + 's';
      const data = { no_of_sec: { name: 'Amount of Data', val: h + m + s } } as object;
      return data;
    }
  },
};
