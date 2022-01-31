// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Backend implementation of the sign langauge video data scenario

import { MicrotaskList, IBackendScenarioInterface } from '../ScenarioInterface';
import {
  baseSignLanguageVideoScenario,
  BaseSignLanguageVideoScenario,
  TaskRecordType,
  MicrotaskType,
  MicrotaskRecordType,
  MicrotaskGroup,
} from '@karya/core';
import { BasicModel } from '@karya/common';
import { Promise as BBPromise } from 'bluebird';
import { promises as fsp } from 'fs';

/**
 * Process the input file for the speech data task.
 * @param task Speech data task record
 * @param jsonFilePath Path to JSON file
 * @param tarFilePath --
 * @param task_folder Task folder path
 */
async function processInputFile(
  task: TaskRecordType<'SIGN_LANGUAGE_VIDEO'>,
  jsonData?: any,
  tarFilePath?: string,
  task_folder?: string
): Promise<MicrotaskList<'SIGN_LANGUAGE_VIDEO'>> {
  if (task.assignment_granularity == 'MICROTASK') {
    const sentences: { sentence: string }[] = jsonData!!;
    const microtasks = sentences.map((sentence) => {
      const mt: MicrotaskType<'SIGN_LANGUAGE_VIDEO'> = {
        task_id: task.id,
        input: { data: sentence },
        deadline: task.deadline,
        credits: task.params.creditsPerMicrotask,
        status: 'INCOMPLETE',
      };
      return mt;
    });

    return [{ mg: null, microtasks }];
  } else {
    const conversations: { sentence: string }[][] = jsonData!!;
    const groups = conversations.map((conversation) => {
      const microtasks = conversation.map((sentence) => {
        const mt: MicrotaskType<'SIGN_LANGUAGE_VIDEO'> = {
          task_id: task.id,
          input: { data: sentence },
          deadline: task.deadline,
          credits: task.params.creditsPerMicrotask,
          status: 'INCOMPLETE',
        };
        return mt;
      });
      const mg: MicrotaskGroup = {
        task_id: task.id,
        microtask_assignment_order: task.microtask_assignment_order,
        status: 'INCOMPLETE',
      };
      return { mg, microtasks };
    });
    return groups;
  }
}

// Backend speech data scenario
export const backendSignLanguageVideoScenario: IBackendScenarioInterface<BaseSignLanguageVideoScenario> = {
  ...baseSignLanguageVideoScenario,
  processInputFile,

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
};
