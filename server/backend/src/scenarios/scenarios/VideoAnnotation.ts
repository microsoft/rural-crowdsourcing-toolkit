// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Backend implementation of the video labelling scenario

import { BaseVideoAnnotationScenario, baseVideoAnnotationScenario, MicrotaskGroup, MicrotaskType } from '@karya/core';
import { IBackendScenarioInterface } from '../ScenarioInterface';
import { promises as fsp } from 'fs';
import { Promise as BBPromise } from 'bluebird';

export const backendVideoAnnotationScenario: IBackendScenarioInterface<BaseVideoAnnotationScenario> = {
  ...baseVideoAnnotationScenario,

  /**
   * Input file processing for video transcription task
   */
  async processInputFile(task, jsonData, tarFilePath, task_folder) {
    // Get all objects from the json data
    const videos: { image: string }[][] = jsonData!;

    const mg: MicrotaskGroup = {
      task_id: task.id,
      status: 'INCOMPLETE',
      microtask_assignment_order: 'SEQUENTIAL',
    };

    // Extracts the microtasks
    const microtaskGroups = await BBPromise.mapSeries(videos, async (videos) => {
      const microtasks = await BBPromise.mapSeries(videos, async ({ image, ...rest }) => {
        const filePath = `${task_folder}/${image}`;
        try {
          await fsp.access(filePath);
          const microtask: MicrotaskType<'VIDEO_ANNOTATION'> = {
            task_id: task.id,
            input: { data: rest, files: { image } },
            deadline: task.deadline,
            credits: task.params.creditsPerMicrotask,
            status: 'INCOMPLETE',
          };
          return microtask;
        } catch (e) {
          throw new Error(`Video file not present`);
        }
      });
      return { mg, microtasks };
    });

    return microtaskGroups;
  },

  /**
   * Generate task output for video transcription microtask
   * TODO: Temporary stub
   */
  async generateOutput(task, assignments, microtasks, task_folder, timestamp) {
    return [];
  },

  /**
   * Generate video transcription microtask output
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
