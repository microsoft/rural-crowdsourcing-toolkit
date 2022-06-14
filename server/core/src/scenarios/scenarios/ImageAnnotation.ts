// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Base implementation of the image labelling scenario

import Joi from 'joi';
import { BaseScenarioInterface } from '../ScenarioInterface';

// Image transcription task input parameters
type ImageAnnotationTaskInputParameters = {
  labels: string[];
};

// Image transcription microtask input/output format
type ImageAnnotationMicrotaskInputFiles = { image: string };
type ImageAnnotationMicrotaskOutput = { labels: any[] };

// Base image transcription scenario type
export type BaseImageAnnotationScenario = BaseScenarioInterface<
  'IMAGE_ANNOTATION',
  ImageAnnotationTaskInputParameters,
  {},
  ImageAnnotationMicrotaskInputFiles,
  ImageAnnotationMicrotaskOutput,
  {}
>;

// Base image transcription scenario
export const baseImageAnnotationScenario: BaseImageAnnotationScenario = {
  name: 'IMAGE_ANNOTATION',
  full_name: 'Image Annotation',
  description: 'This scenario allows users to tag images with a set of labels',

  task_input: [
    {
      id: 'labels',
      type: 'list',
      label: 'Label List',
      description: 'List of labels to be attached to the images',
      required: true,
    },
  ],

  task_input_file: {
    json: {
      required: true,
      description: `JSON file containing an array of objects. Each object must have an image key with the name of the image file`,
      schema: Joi.array().items(Joi.object({ image: Joi.string().required() }).unknown(true)),
    },
    tgz: {
      required: true,
      description: 'Tar ball containing all the images referenced in the json input',
    },
  },

  microtask_input: Joi.object({}),
  microtask_input_files: ['image'],
  microtask_output: Joi.object({ transcription: Joi.string().required() }),
  microtask_output_files: [],

  assignment_granularity: 'MICROTASK',
  group_assignment_order: 'EITHER',
  microtask_assignment_order: 'EITHER',
  response_type: 'UNIQUE',

  languageString(task) {
    return 'N/A';
  },
};
