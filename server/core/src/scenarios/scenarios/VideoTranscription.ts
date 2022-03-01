// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Implementation of the video transcription

import { BaseScenarioInterface } from '../ScenarioInterface';
import Joi from 'joi';

// Sign langauge video verification input/output format
type VideoTranscriptionMicrotaskInput = {
  sentence: string;
};

type VideoTranscriptionMicrotaskInputFiles = {
  recording: string;
};

type VideoTranscriptionMicrotaskOutput = {
  format: string;
  transcript: string;
};

// Base sign language video verification scenario type
export type BaseVideoTranscriptionScenario = BaseScenarioInterface<
  'VIDEO_TRANSCRIPTION',
  {},
  VideoTranscriptionMicrotaskInput,
  VideoTranscriptionMicrotaskInputFiles,
  VideoTranscriptionMicrotaskOutput,
  {}
>;

// Sign language video verification scenario
export const baseVideoTranscriptionScenario: BaseVideoTranscriptionScenario = {
  name: 'VIDEO_TRANSCRIPTION',
  full_name: 'Video Transcription',
  description: 'This scenario enables a videos to be transcribed',

  task_input: [],

  task_input_file: {
    json: {
      required: true,
      description:
        'JSON file containing an array of objects. Each object must have a sentence field that contains the sentence prompt and a recording field that contains the name of the recording file',
      schema: Joi.array().items(
        Joi.object({ sentence: Joi.string().required(), recording: Joi.string().required() }).unknown(true)
      ),
    },

    tgz: {
      required: true,
      description: 'Tar ball containing all the recordings with the names matching those provided in the JSON file',
    },
  },

  microtask_input: Joi.object({ sentence: Joi.string().required() }).unknown(true),
  microtask_input_files: ['recording'],

  microtask_output: Joi.object({
    format: Joi.string().required(),
    transcript: Joi.string().required(),
  }),

  microtask_output_files: [],

  assignment_granularity: 'MICROTASK',
  group_assignment_order: 'EITHER',
  microtask_assignment_order: 'EITHER',
  response_type: 'MULTIPLE_SUBJECTIVE',

  languageString(task) {
    return 'Sign Langauge';
  },
};
