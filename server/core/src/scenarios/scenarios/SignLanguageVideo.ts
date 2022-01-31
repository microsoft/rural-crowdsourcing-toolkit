// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Implementation of the sign language video data collection

import { BaseScenarioInterface } from '../ScenarioInterface';
import Joi from 'joi';

// Sign language video data input format
type SignLanguageVideoMicrotaskInput = { sentence: string };
type SignLanguageVideoMicrotaskInputFiles = {};

// Sign language video data output format
type SignLanguageVideoMicrotaskOutput = {};
type SignLanguageVideoMicrotaskOutputFiles = { recording: string };

// Base sign langauge video data scenario type
export type BaseSignLanguageVideoScenario = BaseScenarioInterface<
  'SIGN_LANGUAGE_VIDEO',
  {},
  SignLanguageVideoMicrotaskInput,
  SignLanguageVideoMicrotaskInputFiles,
  SignLanguageVideoMicrotaskOutput,
  SignLanguageVideoMicrotaskOutputFiles
>;

const mtSchema = Joi.object({ sentence: Joi.string().required() }).unknown(true);

// Task input file format for sign language video data task
const task_input_file: BaseSignLanguageVideoScenario['task_input_file'] = {
  json: {
    required: true,
    description: `\
    JSON file containing an array of objects. Each object must have a sentence field that contains the\
    sentence prompt for the recording.\
    `,
    schema: Joi.array().items(Joi.alternatives().try(mtSchema, Joi.array().items(mtSchema))),
  },
  tgz: { required: false },
};

/**
 * Sign language video data scenario implementation
 */
export const baseSignLanguageVideoScenario: BaseSignLanguageVideoScenario = {
  name: 'SIGN_LANGUAGE_VIDEO',
  full_name: 'Sign Language Video Collection',
  description: 'This scenario allows for collection of sign language video data from a text corpus.',
  task_input: [],
  task_input_file,
  microtask_input: Joi.object({ sentence: Joi.string().required() }),
  microtask_input_files: [],
  microtask_output: Joi.object({}),
  microtask_output_files: ['recording'],
  assignment_granularity: 'EITHER',
  group_assignment_order: 'EITHER',
  microtask_assignment_order: 'EITHER',
  response_type: 'MULTIPLE_SUBJECTIVE',

  languageString(task) {
    return 'Sign Language';
  },
};
