// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Implementation of the speech-data scenario

import { BaseScenarioInterface } from '../ScenarioInterface';
import Joi from 'joi';
import { LanguageCode, languageMap, languageParameter } from '../../languages/Index';

// Speech data task input parameters
type SpeechDataTaskInputParameters = {
  language: LanguageCode;
  compress: boolean;
  sampling_rate: string;
  bitwidth: string;
  maxRecordingLength?: number;
  minRecordingLength?: number;
  noForcedReplay: boolean;
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
    id: 'compress',
    label: 'Compress audio files?',
    description: 'If checked, audio files will be compressed using AAC',
    type: 'boolean',
    required: false,
  },

  {
    id: 'sampling_rate',
    label: 'Sampling rate',
    description: 'Sampling rate to be used for the audio recording',
    type: 'enum',
    required: true,
    list: [
      ['8k', '8 Khz'],
      ['16k', '16 Khz'],
      ['44k', '44 Khz'],
    ],
  },

  {
    id: 'bitwidth',
    label: 'Bitwidth per sample',
    description: 'Bitwidth for each sample',
    required: true,
    type: 'enum',
    list: [
      ['8', '8 bit per sample'],
      ['16', '16 bits per sample'],
    ],
  },

  {
    id: 'noForcedReplay',
    label: 'Avoid forced replay of recorded sentence',
    description:
      'App will not force the users to listen to their recorded sentence. Users can optionally listen if they want to',
    required: false,
    type: 'boolean',
  },

  {
    id: 'minRecordingLength',
    label: 'Min limit on the recording length in seconds',
    description: 'If the recording length is below the given number, the recording will be rejected by the app',
    required: false,
    type: 'int',
  },

  {
    id: 'maxRecordingLength',
    label: 'Max limit on the recording length in seconds',
    description: 'If the recording length exceeds the given number, the recording will be rejected by the app',
    required: false,
    type: 'int',
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
  tgz: {
    required: true,
    description: `Optional audio files for hints. Upload empty tarball if no hints`,
  },
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

  languageString(task) {
    return languageMap[task.params.language].primary_name;
  },
};
