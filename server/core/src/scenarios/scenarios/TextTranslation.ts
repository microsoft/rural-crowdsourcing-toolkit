// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Base implementation of the text-translation scenario

import { BaseScenarioInterface } from '../ScenarioInterface';
import Joi from 'joi';

// Text translation task input parameters
type TextTranslationTaskInputParameters = {
  instruction: string;
  numUniqueTranslations: number;
  numTranslations: number;
  creditsPerTranslation: number;
  mode: string;
};

// Text translation microtask input format
type TextTranslationMicrotaskInput = { sentence: string };
type TextTranslationMicrotaskInputFiles = {};

// Text translation microtask output format
type TextTranslationMicrotaskOutput = { sentence: string };
type TextTranslationMicrotaskOutputFiles = {};

// Base text translation scenario type
export type BaseTextTranslationScenario = BaseScenarioInterface<
  'TEXT_TRANSLATION',
  TextTranslationTaskInputParameters,
  TextTranslationMicrotaskInput,
  TextTranslationMicrotaskInputFiles,
  TextTranslationMicrotaskOutput,
  TextTranslationMicrotaskOutputFiles
>;

// Text translation task input parameters description
const task_input: BaseTextTranslationScenario['task_input'] = [
  {
    id: 'instruction',
    type: 'string',
    label: 'Translation Instruction',
    description: 'Translation instruction to be shown to the user in the client app',
    required: true,
  },

  {
    id: 'numTranslations',
    type: 'int',
    label: 'Limit on Number of Translations',
    description: 'Maximum number of translations required for each sentence',
    required: true,
  },

  {
    id: 'numUniqueTranslations',
    type: 'int',
    label: 'Number of Unique Translations',
    description: 'Number of unique translations required for each sentence',
    required: true,
  },

  {
    id: 'mode',
    type: 'string',
    label: 'AI support (none | bow | dd1 | dd2)',
    description:
      'Provide support for translation through an ML model. none: No support. bow: Bag of words. dd1: Drop down suggestions with 1 word. dd2: Drop down suggestions with 2 words',
    required: true,
  },

  {
    id: 'creditsPerTranslation',
    type: 'float',
    label: 'Credits for Each Translation',
    description: 'Number of credits to be given to the user for each correctly translated sentence',
    required: true,
  },
];

// Text translation task input file format
const task_input_file: BaseTextTranslationScenario['task_input_file'] = {
  json: {
    required: true,
    description: `JSON file containing an array of objects. Each object must have a sentence field that contains the sentence prompt for the recording.`,
    schema: Joi.array().items(Joi.object({ sentence: Joi.string() }).unknown(true)),
  },
  tgz: { required: false },
};

// Text translation scenario
export const baseTextTranslationScenario: BaseTextTranslationScenario = {
  name: 'TEXT_TRANSLATION',
  full_name: 'Text-to-Text Translation',
  description: 'This scenario allows for translation of text (sentences) from one language to another',
  task_input,
  task_input_file,
  microtask_input: Joi.object({ sentence: Joi.string().required() }).unknown(true),
  microtask_input_files: [],
  microtask_output: Joi.object({ sentence: Joi.string().required() }).unknown(true),
  microtask_output_files: [],
  assignment_granularity: 'MICROTASK',
  group_assignment_order: 'EITHER',
  microtask_assignment_order: 'EITHER',
  response_type: 'MULTIPLE_OBJECTIVE',
};
