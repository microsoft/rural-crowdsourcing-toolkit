// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Base implementation of the speech-verification scenario

import { BaseScenarioInterface } from '../ScenarioInterface';
import Joi from 'joi';
import { LanguageCode, languageMap, languageParameter } from '../../languages/Index';

// Speech verification task input parameters
type SpeechVerificationTaskInputParameters = {
  language: LanguageCode;
};

// Speech verification microtask input format
type SpeechVerificationMicrotaskInput = { sentence: string };
type SpeechVerificationMicrotaskInputFiles = { recording: string };

// Speech verificaion microtask output format
type SpeechVerificationMicrotaskOutput =
  | {
      auto: false | undefined;
      accuracy: number;
      quality: number;
      volume: number;
    }
  | {
      auto: true;
      score: number;
      fraction: number;
    };
type SpeechVerificationMicrotaskOutputFiles = {};

// Base speech verification scenario type
export type BaseSpeechVerificationScenario = BaseScenarioInterface<
  'SPEECH_VERIFICATION',
  SpeechVerificationTaskInputParameters,
  SpeechVerificationMicrotaskInput,
  SpeechVerificationMicrotaskInputFiles,
  SpeechVerificationMicrotaskOutput,
  SpeechVerificationMicrotaskOutputFiles
>;

// Speech verification task inputs
const task_input: BaseSpeechVerificationScenario['task_input'] = [
  languageParameter('language', 'Language', 'Language of the recordings and transcript'),
];

// Task input file format for speech verification
const task_input_file: BaseSpeechVerificationScenario['task_input_file'] = {
  json: {
    required: true,
    description: `JSON file containing an array of objects. Each object must have a sentence field that contains the sentence prompt and a recording field that contains the name of the recording file`,
    schema: Joi.array().items(
      Joi.object({ sentence: Joi.string().required(), recording: Joi.string().required() }).unknown(true)
    ),
  },
  tgz: {
    required: true,
    description: `Tar ball containing all the recordings with the names matching those provided in the JSON file`,
  },
};

// Base speech verification scenario
export const baseSpeechVerificationScenario: BaseSpeechVerificationScenario = {
  name: 'SPEECH_VERIFICATION',
  full_name: 'Speech Verification',
  description: 'This scenario allows users to verify an audio recording against a sentence and rate its quality',
  task_input,
  task_input_file,
  microtask_input: Joi.object({ sentence: Joi.string().required() }).unknown(true),
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
