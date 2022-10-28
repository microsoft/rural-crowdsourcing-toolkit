// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Backend implementation of the image labelling scenario

import {
  BaseImageAnnotationValidationScenario,
  baseImageAnnotationValidationScenario,
  MicrotaskType,
} from '@karya/core';
import { IBackendScenarioInterface } from '../ScenarioInterface';
import { promises as fsp } from 'fs';
import { Promise as BBPromise } from 'bluebird';

export const backendImageAnnotationValidationScenario: IBackendScenarioInterface<BaseImageAnnotationValidationScenario> = {
  ...baseImageAnnotationValidationScenario,

  /**
   * Input file processing for image transcription task
   */
  async processInputFile(task, jsonData, tarFilePath, task_folder) {
    // Get all objects from the json data
    const images: { image: string }[] = jsonData!;

    // Extracts the microtasks
    const microtasks = await BBPromise.mapSeries(images, async ({ image, ...rest }) => {
      const filePath = `${task_folder}/${image}`;
      try {
        await fsp.access(filePath);
        const microtask: MicrotaskType<'IMAGE_ANNOTATION_VALIDATION'> = {
          task_id: task.id,
          input: { data: rest, files: { image } },
          deadline: task.deadline,
          base_credits: task.params.baseCreditsPerMicrotask,
          credits: task.params.creditsPerMicrotask,
          status: 'INCOMPLETE',
        };
        return microtask;
      } catch (e) {
        throw new Error(`Image file not present`);
      }
    });

    return [{ mg: null, microtasks }];
  },

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
