// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Implementation of the transliteration corpus

import Joi from 'joi';
import { LanguageCode, languageMap, languageParameter } from '../../languages/Index';
import { BaseScenarioInterface } from '../ScenarioInterface';

// Transliteration task input parameters
type XliterationTaskInputParameters = {
  language: LanguageCode;
  allowValidation: boolean;
  mlFeedback: boolean;
  limit: number;
  creditsPerVariant: number;
  creditsPerValidation: number;
};

// Input/output format
type XliterationProvider = 'HUMAN' | 'ML';
type XliterationStatus = 'NEW' | 'VALID' | 'INVALID' | 'UNKNOWN';

type XliterationMicrotaskInput = {
  word: string;
  limit: number;
  variants: {
    [id: string]: {
      source: XliterationProvider;
      status: XliterationStatus;
    };
  };
};

type XliterationMicrotaskOutput = {
  variants: {
    [id: string]: {
      source: XliterationProvider;
      status: XliterationStatus;
    };
  };
};

// Base transliteration scenario type
export type BaseXliterationDataScenario = BaseScenarioInterface<
  'XLITERATION_DATA',
  XliterationTaskInputParameters,
  XliterationMicrotaskInput,
  {},
  XliterationMicrotaskOutput,
  {}
>;

// Task parameters
const task_input: BaseXliterationDataScenario['task_input'] = [
  languageParameter('language', 'Language', 'Language of the source words'),

  {
    id: 'allowValidation',
    type: 'boolean',
    label: 'Allow Validation',
    description: 'Should the user be allowed to validate prior variants',
    required: false,
  },

  {
    id: 'mlFeedback',
    type: 'boolean',
    label: 'In-app ML feedback',
    description: 'Provide in-app ML feedback to user when model things a variant is incorrect',
    required: false,
  },

  {
    id: 'limit',
    type: 'int',
    label: 'Limit on variants',
    description: 'Limit on the number of variants that can be added',
    required: true,
  },

  {
    id: 'creditsPerVariant',
    type: 'float',
    label: 'Credits for Each Variant',
    description: 'Number of credits for each correct variant of a word',
    required: true,
  },

  {
    id: 'creditsPerValidation',
    type: 'float',
    label: 'Credits for Each Validation',
    description: 'Number of credits for each validation provided by a user',
    required: true,
  },
];

// Tranasliteration scenario
export const baseXliterationDataScenario: BaseXliterationDataScenario = {
  name: 'XLITERATION_DATA',
  full_name: 'Transliteration Corpus',
  description: 'This scenario allows collection of a tranliteration corpus for a set of words',
  task_input,

  task_input_file: {
    json: {
      required: true,
      description: `JSON file containing an array of objects. Each object must contain a word field that contains the source word and a limit indicating the maximum number of variants requested for that word.`,
      schema: Joi.array().items(Joi.object({ word: Joi.string(), limit: Joi.number() }).unknown(true)),
    },
    tgz: { required: false },
  },

  // TODO: need better specification of Joi schema
  microtask_input: Joi.object({ word: Joi.string().required(), limit: Joi.number().required() }),
  microtask_input_files: [],
  // TODO: need better specification of Joi schema
  microtask_output: Joi.object({ variants: Joi.array().items(Joi.string()) }),
  microtask_output_files: [],

  assignment_granularity: 'MICROTASK',
  group_assignment_order: 'EITHER',
  microtask_assignment_order: 'EITHER',

  response_type: 'MULTIPLE_OBJECTIVE',

  languageString(task) {
    return languageMap[task.params.language].primary_name;
  },
};
