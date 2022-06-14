// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Implementation of the sign language video verification

import { BaseScenarioInterface } from '../ScenarioInterface';
import Joi from 'joi';

// Sign langauge video verification input/output format
type SignLanguageVideoVerificationMicrotaskInput = {
  sentence: string;
};

type SignLanguageVideoVerificationMicrotaskInputFiles = {
  recording: string;
};

type SignLanguageVideoVerificationMicrotaskOutput = {
  score: number;
  remarks: string;
};

// Base sign language video verification scenario type
export type BaseSignLanguageVideoVerificationScenario = BaseScenarioInterface<
  'SGN_LANG_VIDEO_VERIFICATION',
  {},
  SignLanguageVideoVerificationMicrotaskInput,
  SignLanguageVideoVerificationMicrotaskInputFiles,
  SignLanguageVideoVerificationMicrotaskOutput,
  {}
>;

// Sign language video verification scenario
export const baseSignLanguageVideoVerificationScenario: BaseSignLanguageVideoVerificationScenario = {
  name: 'SGN_LANG_VIDEO_VERIFICATION',
  full_name: 'Sign Language Video Verification',
  description: 'This scenario enables verification of sign language videos in the context of the source sentence',

  task_input: [],

  task_input_file: {
    json: {
      required: true,
      description:
        'JSON file containing an array of objects. Each object must have a sentence field that contains the sentence prompt and a recording field that contains the name of the recording file',
      schema: Joi.array().items(Joi.object({ sentence: Joi.string().required(), recording: Joi.string().required() })),
    },

    tgz: {
      required: true,
      description: 'Tar ball containing all the recordings with the names matching those provided in the JSON file',
    },
  },

  microtask_input: Joi.object({ sentence: Joi.string().required() }).unknown(true),
  microtask_input_files: ['recording'],

  microtask_output: Joi.object({
    score: Joi.number().required(),
    remarks: Joi.string().required(),
  }),

  microtask_output_files: [],

  assignment_granularity: 'MICROTASK',
  group_assignment_order: 'EITHER',
  microtask_assignment_order: 'SEQUENTIAL',
  response_type: 'MULTIPLE_SUBJECTIVE',

  languageString(task) {
    return 'Sign Langauge';
  },
};
