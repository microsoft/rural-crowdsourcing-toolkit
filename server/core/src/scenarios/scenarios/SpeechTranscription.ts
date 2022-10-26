// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Base implementation of the speech-transcription scenario

import { BaseScenarioInterface } from '../ScenarioInterface';
import Joi from 'joi';
import { LanguageCode, languageMap, languageParameter } from '../../languages/Index';

// Speech transcription task input parameters
type SpeechTranscriptionTaskInputParameters = {
  language: LanguageCode;
};

// Speech Transcription microtask input format
type SpeechTranscriptionMicrotaskInput = { sentence?: string; transcript?: string };
type SpeechTranscriptionMicrotaskInputFiles = { recording: string };

// Speech transcription microtask output format
type SpeechTranscriptionMicrotaskOutput = { transcription: string };
type SpeechTranscriptionMicrotaskOutputFiles = {};

// Base speech Transcription scenario type
export type BaseSpeechTranscriptionScenario = BaseScenarioInterface<
  'SPEECH_TRANSCRIPTION',
  SpeechTranscriptionTaskInputParameters,
  SpeechTranscriptionMicrotaskInput,
  SpeechTranscriptionMicrotaskInputFiles,
  SpeechTranscriptionMicrotaskOutput,
  SpeechTranscriptionMicrotaskOutputFiles
>;

// Speech transcription task inputs
const task_input: BaseSpeechTranscriptionScenario['task_input'] = [
  languageParameter('language', 'Language', 'Language of the recordings and transcript'),
];

// Task input file format for speech transcription
const task_input_file: BaseSpeechTranscriptionScenario['task_input_file'] = {
  json: {
    required: true,
    description: `JSON file containing an array of objects. Each object must have a sentence field that contains the sentence prompt for transcription hint and a recording field that contains the name of the recording file`,
    schema: Joi.array().items(Joi.object({ sentence: Joi.string(), recording: Joi.string().required() }).unknown(true)),
  },
  tgz: {
    required: true,
    description: `Tar ball containing all the recordings with the names matching those provided in the JSON file`,
  },
};

// Base speech transcription scenario
export const baseSpeechTranscriptionScenario: BaseSpeechTranscriptionScenario = {
  name: 'SPEECH_TRANSCRIPTION',
  full_name: 'Speech Transcription',
  description: 'This scenario allows users to provide transcription for an audio recording',
  task_input,
  task_input_file,
  microtask_input: Joi.object({ sentence: Joi.string() }).unknown(true),
  microtask_input_files: ['recording'],
  microtask_output: Joi.object({
    accuracy: Joi.number().required(),
    quality: Joi.number().required(),
    volume: Joi.number().required(),
  }),
  microtask_output_files: [],
  assignment_granularity: 'MICROTASK',
  group_assignment_order: 'EITHER',
  microtask_assignment_order: 'EITHER',
  response_type: 'MULTIPLE_SUBJECTIVE',

  languageString(task) {
    return languageMap[task.params.language].primary_name;
  },
};
