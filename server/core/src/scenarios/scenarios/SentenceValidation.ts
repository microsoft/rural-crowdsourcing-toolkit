// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Implementation of the sentence validation scenario
// TODO: Should be merged with sentence corpus verification at some point

import Joi from 'joi';
import { LanguageCode, languageMap, languageParameter } from '../../languages/Index';
import { BaseScenarioInterface } from '../ScenarioInterface';

// Sentence validation task input parameters
type SentenceValidationTaskInputParameters = {
  language: LanguageCode;
};

type SentenceValidationMicrotaskInput = {
  sentence: string;
};

type SentenceValidationMicrotaskOutput = {
  grammar: boolean;
  spelling: boolean;
};

// Base sentence validation scenario type
export type BaseSentenceValidationScenario = BaseScenarioInterface<
  'SENTENCE_VALIDATION',
  SentenceValidationTaskInputParameters,
  SentenceValidationMicrotaskInput,
  {},
  SentenceValidationMicrotaskOutput,
  {}
>;

// Task parameters
const task_input: BaseSentenceValidationScenario['task_input'] = [
  languageParameter('language', 'Language', 'Language of the source words'),
];

// Tranasliteration scenario
export const baseSentenceValidationScenario: BaseSentenceValidationScenario = {
  name: 'SENTENCE_VALIDATION',
  full_name: 'Sentence Validation',
  description: 'This scenario allows validation of a set of sentences. Each sentence is either marked as valid or not',
  task_input,

  task_input_file: {
    json: {
      required: true,
      description: `JSON file containing an array of objects. Each object must contain a sentence field with the sentence to be validated`,
      schema: Joi.array().items(Joi.object({ sentence: Joi.string() }).unknown(true)),
    },
    tgz: { required: false },
  },

  // TODO: need better specification of Joi schema
  microtask_input: Joi.object({ string: Joi.string().required() }),
  microtask_input_files: [],
  // TODO: need better specification of Joi schema
  microtask_output: Joi.object({ valid: Joi.boolean() }),
  microtask_output_files: [],

  assignment_granularity: 'MICROTASK',
  group_assignment_order: 'EITHER',
  microtask_assignment_order: 'EITHER',

  response_type: 'UNIQUE',

  languageString(task) {
    return languageMap[task.params.language].primary_name;
  },
};
