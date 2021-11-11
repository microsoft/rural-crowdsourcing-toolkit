// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Image data collection scenerio

import Joi from 'joi';
import { BaseScenarioInterface } from '../ScenarioInterface';

// Image data input parameters
type ImageDataTaskInputParameters = {
  source: string;
};

// Image data microtask input
type ImageDataMicrotaskInput = {
  count: number;
};
const microtaskInputSchema = Joi.object({ count: Joi.number().integer().positive() }).unknown(true);

// Image data output
type ImageDataMicrotaskOutputFiles = { [id: string]: string };

// Base image data scenario type
export type BaseImageDataScenario = BaseScenarioInterface<
  'IMAGE_DATA',
  ImageDataTaskInputParameters,
  ImageDataMicrotaskInput,
  {},
  {},
  ImageDataMicrotaskOutputFiles
>;

/**
 * Image data scenario implementation
 */
export const baseImageDataScenario: BaseImageDataScenario = {
  name: 'IMAGE_DATA',
  full_name: 'Image Data Collection',
  description: 'This scenario allows a user to build an image data corpus',

  task_input: [
    {
      id: 'source',
      label: 'Source of the images',
      description: 'Where should the images be collected from?',
      type: 'enum',
      list: [['book', 'Books']],
      required: true,
    },
  ],

  task_input_file: {
    json: {
      required: true,
      description:
        'JSON file with list of microtasks. Each microtask specifies the count of number of images to be collected',
      schema: Joi.array().items(microtaskInputSchema),
    },
    tgz: {
      required: false,
    },
  },

  microtask_input: microtaskInputSchema,
  microtask_input_files: [],

  microtask_output: Joi.object({}),
  microtask_output_files: [],

  assignment_granularity: 'MICROTASK',
  group_assignment_order: 'EITHER',
  microtask_assignment_order: 'EITHER',

  response_type: 'MULTIPLE_SUBJECTIVE',

  languageString(task) {
    return 'N/A';
  },
};
