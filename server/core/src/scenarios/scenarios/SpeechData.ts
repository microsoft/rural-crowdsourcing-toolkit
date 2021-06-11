// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Implementation of the speech-data scenario

import { BaseScenarioInterface } from '../ScenarioInterface';
import Joi from 'joi';
import { LanguageCode, languageParameter } from '../../languages/Index';

// Speech data task input parameters
type SpeechDataTaskInputParameters = {
  language: LanguageCode;
  instruction: string;
  creditsPerRecording: number;
};

// Speech data input format
type SpeechDataMicrotaskInput = { sentence: string };
type SpeechDataMicrotaskInputFiles = {};

// Speech data output format
type SpeechDataMicrotaskOutput = {};
type SpeechDataMicrotaskOutputFiles = { recording: string };

// Base speech data scenario type
export type BaseSpeechDataScenario = BaseScenarioInterface<
  'SPEECH_DATA',
  SpeechDataTaskInputParameters,
  SpeechDataMicrotaskInput,
  SpeechDataMicrotaskInputFiles,
  SpeechDataMicrotaskOutput,
  SpeechDataMicrotaskOutputFiles
>;

/**
 * Task parameter input and file formats.
 */
const task_input: BaseSpeechDataScenario['task_input'] = [
  languageParameter('language', 'Language', 'Language in which the recordings are collected'),

  {
    id: 'instruction',
    type: 'string',
    label: 'Recording Instruction',
    description: 'Recording instruction to be shown to the user on the client app',
    required: true,
  },

  {
    id: 'creditsPerRecording',
    type: 'float',
    label: 'Credits for Each Recording',
    description: 'Number of credits to be given to the user for each correctly recorded sentence',
    required: true,
  },
];

// Task input file format for speech data task
const task_input_file: BaseSpeechDataScenario['task_input_file'] = {
  json: {
    required: true,
    description: `\
    JSON file containing an array of objects. Each object must have a sentence field that contains the\
    sentence prompt for the recording.\
    `,
    schema: Joi.array().items(Joi.object({ sentence: Joi.string() }).unknown(true)),
  },
  tgz: { required: false },
};

/**
 * Speech data scenario implementation
 */
export const baseSpeechDataScenario: BaseSpeechDataScenario = {
  name: 'SPEECH_DATA',
  full_name: 'Speech Data Collection',
  description: 'This scenario allows for collection of speech data from a text corpus.',
  task_input,
  task_input_file,
  microtask_input: Joi.object({ sentence: Joi.string().required() }),
  microtask_input_files: [],
  microtask_output: Joi.object({}),
  microtask_output_files: ['recording'],
  assignment_granularity: 'MICROTASK',
  group_assignment_order: 'EITHER',
  microtask_assignment_order: 'EITHER',
  response_type: 'MULTIPLE_SUBJECTIVE',
};
