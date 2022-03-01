// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Backend implementation of the sign language video verification scenario

import { BaseVideoTranscriptionScenario, baseVideoTranscriptionScenario, MicrotaskType } from '@karya/core';
import { IBackendScenarioInterface } from '../ScenarioInterface';
import { Promise as BBPromise } from 'bluebird';
import { promises as fsp } from 'fs';

export const backendVideoTranscriptionScenario: IBackendScenarioInterface<BaseVideoTranscriptionScenario> = {
  ...baseVideoTranscriptionScenario,

  /** Process input files */
  async processInputFile(task, jsonData, tarFilePath, taskFolder) {
    // Get all the objects from the json Data
    const verifications: { sentence: string; recording: string }[] = jsonData!;

    // Extract the microtasks
    const microtasks = await BBPromise.mapSeries(verifications, async ({ sentence, recording }) => {
      const filePath = `${taskFolder}/${recording}`;
      try {
        await fsp.access(filePath);

        const microtask: MicrotaskType<'VIDEO_TRANSCRIPTION'> = {
          task_id: task.id,
          input: {
            data: { sentence },
            files: { recording },
          },
          deadline: task.deadline,
          credits: task.params.creditsPerMicrotask,
          status: 'INCOMPLETE',
        };

        return microtask;
      } catch (e) {
        throw new Error(`Recording file not present`);
      }
    });

    return [{ mg: null, microtasks }];
  },

  /**
   * Generate output for sign video verification task. A single JSON file for each
   * completed microtask that contains the source sentence, source recording
   * name and the output.
   */
  async generateOutput(task, assignments, microtasks, task_folder, timestamp) {
    return [];
  },

  /**
   * Generate sign video verification microtask output from a list of verified
   * assignments.
   */
  async microtaskOutput(task, microtask, assignments) {
    // TODO: Make the reduction function dependent on a task parameter?

    return null;
  },
};
