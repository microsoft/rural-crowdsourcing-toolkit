// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Base implementation of the image transcription scenario

import Joi from 'joi';
import { LanguageCode, languageParameter, languageMap } from '../../languages/Index';
import { BaseScenarioInterface } from '../ScenarioInterface';

// Image transcription task input parameters
type ImageTranscriptionTaskInputParameters = {
  language: LanguageCode;
};

// Image transcription microtask input/output format
type ImageTranscriptionMicrotaskInputFiles = { image: string };
type ImageTranscriptionMicrotaskOutput = { transcription: string };

// Base image transcription scenario type
export type BaseImageTranscriptionScenario = BaseScenarioInterface<
  'IMAGE_TRANSCRIPTION',
  ImageTranscriptionTaskInputParameters,
  {},
  ImageTranscriptionMicrotaskInputFiles,
  ImageTranscriptionMicrotaskOutput,
  {}
>;

// Base image transcription scenario
export const baseImageTranscriptionScenario: BaseImageTranscriptionScenario = {
  name: 'IMAGE_TRANSCRIPTION',
  full_name: 'Image Trascription',
  description: 'This scenario allows users to transcribe images into text',

  task_input: [languageParameter('language', 'Language', 'Language of the source images')],

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
