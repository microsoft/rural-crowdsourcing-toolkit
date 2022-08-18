// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Base implementation of the image labelling scenario

import Joi from 'joi';
import { LanguageCode, languageParameter, languageMap } from '../../languages/Index';
import { BaseScenarioInterface } from '../ScenarioInterface';

// Image transcription task input parameters
type ImageLabellingTaskInputParameters = {
  language: LanguageCode;
  labels: string[];
  training: boolean;
  imageByUsers: string;
};

// Image transcription microtask input/output format
type ImageLabellingMicrotaskInputFiles = { image: string };
type ImageLabellingMicrotaskOutput = { transcription: string };

// Base image transcription scenario type
export type BaseImageLabellingScenario = BaseScenarioInterface<
  'IMAGE_LABELLING',
  ImageLabellingTaskInputParameters,
  {},
  ImageLabellingMicrotaskInputFiles,
  ImageLabellingMicrotaskOutput,
  {}
>;

// Base image transcription scenario
export const baseImageLabellingScenario: BaseImageLabellingScenario = {
  name: 'IMAGE_LABELLING',
  full_name: 'Image Labelling',
  description: 'This scenario allows users to tag images with a set of labels',

  task_input: [
    languageParameter('language', 'Language', 'Language of the source images'),

    {
      id: 'labels',
      type: 'list',
      label: 'Label List',
      description: 'List of labels to be attached to the images',
      required: true,
    },

    {
      id: 'training',
      label: 'Training Task?',
      description: 'Is this task for training end users?',
      type: 'boolean',
      required: false,
    },

    {
      id: 'imageByUsers',
      type: 'enum',
      label: 'Image By Users/Server?',
      description: 'Should the images be taken by the user or provided by the server',
      required: true,
      list: [
        ['user', 'User'],
        ['server', 'Server'],
      ],
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
    return languageMap[task.params.language].primary_name;
  },
};
