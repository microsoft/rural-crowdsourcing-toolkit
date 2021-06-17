// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Multi-variant transliteration verification scenario

import { LanguageCode, languageParameter } from '../../languages/Index';
import { BaseScenarioInterface } from '../ScenarioInterface';
import Joi from 'joi';

// Transliteration verification task input parameters
type MVXliterationVerificationTaskInputParameters = {
  language: LanguageCode;
  instruction: string;
  creditsPerVerification: number;
};

// Input/output format
type MVXliterationVerificationMicrotaskInput = {
  word: string;
  variants: string[];
};

type MVXliterationVerificationMicrotaskOutput = {
  validations: boolean[];
};

// Base mv transliteration verification scenario type
export type BaseMVXliterationVerificationScenario = BaseScenarioInterface<
  'MV_XLITERATION_VERIFICATION',
  MVXliterationVerificationTaskInputParameters,
  MVXliterationVerificationMicrotaskInput,
  {},
  MVXliterationVerificationMicrotaskOutput,
  {}
>;

// MV Transliteration Verification Scenario
export const baseMVXliterationVerificationScenario: BaseMVXliterationVerificationScenario = {
  name: 'MV_XLITERATION_VERIFICATION',
  full_name: 'Transliteration Verification',
  description: `This scenario allows for verification of a transliteration corpus`,

  task_input: [
    languageParameter('language', 'Language', 'Language of the source words'),

    {
      id: 'instruction',
      type: 'string',
      label: 'Transliteration Verification Instruction',
      description: 'Verification instruction to be shown to the users on the client app',
      required: true,
    },

    {
      id: 'creditsPerVerification',
      type: 'float',
      label: 'Credits for Each Verification',
      description: 'Number of credits for each correct verification',
      required: true,
    },
  ],

  task_input_file: {
    json: {
      required: true,
      description: `JSON file containing an array of objects. Each object must contain a word and a list of transliteration variants.`,
      schema: Joi.array().items(Joi.object({ word: Joi.string(), variants: Joi.array().items(Joi.string()) })),
    },
    tgz: { required: false },
  },

  microtask_input: Joi.object({ word: Joi.string(), variants: Joi.array().items(Joi.string()) }),
  microtask_input_files: [],
  microtask_output: Joi.object({ validations: Joi.array().items(Joi.boolean()) }),
  microtask_output_files: [],

  assignment_granularity: 'MICROTASK',
  group_assignment_order: 'EITHER',
  microtask_assignment_order: 'EITHER',

  response_type: 'UNIQUE',
};
