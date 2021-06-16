// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Implementation of the multi variant transliteration

import { LanguageCode, languageParameter } from '../../languages/Index';
import { BaseScenarioInterface } from '../ScenarioInterface';
import Joi from 'joi';

// Transliteration task input parameters
type MVXliterationTaskInputParameters = {
  language: LanguageCode;
  instruction: string;
  creditsPerVariant: number;
};

// Input/ouptut format
type MVXliterationMicrotaskInput = { word: string; limit: number };
type MVXliterationMicrotaskOutput = { variants: string[] };

// Base mv transliteration scenario type
export type BaseMVXliterationScenario = BaseScenarioInterface<
  'MV_XLITERATION',
  MVXliterationTaskInputParameters,
  MVXliterationMicrotaskInput,
  {},
  MVXliterationMicrotaskOutput,
  {}
>;

// Task paramters
const task_input: BaseMVXliterationScenario['task_input'] = [
  languageParameter('language', 'Language', 'Language of the source words'),

  {
    id: 'instruction',
    type: 'string',
    label: 'Transliteration Instruction',
    description: 'Transliteration instruction to be displayed to the user in the client app',
    required: true,
  },

  {
    id: 'creditsPerVariant',
    type: 'float',
    label: 'Credits for Each Variant',
    description: 'Number of credits for each correct variant of a word',
    required: true,
  },
];

// MV Transliteration scenario
export const baseMVXliterationScenario: BaseMVXliterationScenario = {
  name: 'MV_XLITERATION',
  full_name: 'Tranliteration Corpus',
  description: 'This scenario allows collection of a tranliteration corpus for a set of words',
  task_input,

  task_input_file: {
    json: {
      required: true,
      description: `JSON file containting an array of objects. Each object must contain a word field that contains the source word and a limit indicating the maximum number of variants requested for that word.`,
      schema: Joi.array().items(Joi.object({ word: Joi.string(), limit: Joi.number() }).unknown(true)),
    },
    tgz: { required: false },
  },

  microtask_input: Joi.object({ word: Joi.string().required(), limit: Joi.number().required() }),
  microtask_input_files: [],
  microtask_output: Joi.object({ variants: Joi.array().items(Joi.string()) }),
  microtask_output_files: [],

  assignment_granularity: 'MICROTASK',
  group_assignment_order: 'EITHER',
  microtask_assignment_order: 'EITHER',

  response_type: 'MULTIPLE_OBJECTIVE',
};
