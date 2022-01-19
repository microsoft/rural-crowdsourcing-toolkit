// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Base implementation of the text-translation validation scenario

import { BaseScenarioInterface } from '../ScenarioInterface';
import Joi from 'joi';
import { LanguageCode, languageMap, languageParameter } from '../../languages/Index';

// Text translation task input parameters
type TextTranslationValidationTaskInputParameters = {
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
};

// Text translation microtask input format
type TextTranslationValidationMicrotaskInput = {
  source: string;
  target: string;
};
type TextTranslationValidationMicrotaskInputFiles = {};

// Text translation microtask output format
type TextTranslationValidationMicrotaskOutput = { score: number };
type TextTranslationValidationMicrotaskOutputFiles = {};

// Base text translation scenario type
export type BaseTextTranslationValidationScenario = BaseScenarioInterface<
  'TEXT_TRANSLATION_VALIDATION',
  TextTranslationValidationTaskInputParameters,
  TextTranslationValidationMicrotaskInput,
  TextTranslationValidationMicrotaskInputFiles,
  TextTranslationValidationMicrotaskOutput,
  TextTranslationValidationMicrotaskOutputFiles
>;

// Text translation task input parameters description
const task_input: BaseTextTranslationValidationScenario['task_input'] = [
  languageParameter('sourceLanguage', 'Source Language', 'Language of the source sentences'),
  languageParameter('targetLanguage', 'Target Language', 'Language of the target sentences'),
];

// Text translation task input file format
const task_input_file: BaseTextTranslationValidationScenario['task_input_file'] = {
  json: {
    required: true,
    description: `JSON file containing an array of objects. Each object must contain two field 'source' and 'target' which have values for source and target sentence respectively.`,
    schema: Joi.array().items(Joi.object({ source: Joi.string(), target: Joi.string() }).unknown(true)),
  },
  tgz: { required: false },
};

// Text translation scenario
export const baseTextTranslationValidationScenario: BaseTextTranslationValidationScenario = {
  name: 'TEXT_TRANSLATION_VALIDATION',
  full_name: 'Text-to-Text Translation Validation',
  description: 'This scenario allows users to specify a score to a translation for a language pair',
  task_input,
  task_input_file,
  microtask_input: Joi.object({ source: Joi.string(), target: Joi.string() }).unknown(true),
  microtask_input_files: [],
  microtask_output: Joi.object({ score: Joi.number().required() }).unknown(true),
  microtask_output_files: [],
  assignment_granularity: 'MICROTASK',
  group_assignment_order: 'EITHER',
  microtask_assignment_order: 'EITHER',
  response_type: 'MULTIPLE_OBJECTIVE',

  languageString(task) {
    const source = languageMap[task.params.sourceLanguage].primary_name;
    const target = languageMap[task.params.targetLanguage].primary_name;
    return `${source} -> ${target}`;
  },
};
