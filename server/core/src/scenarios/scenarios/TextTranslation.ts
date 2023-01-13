// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Base implementation of the text-translation scenario

import { BaseScenarioInterface } from '../ScenarioInterface';
import Joi from 'joi';
import { LanguageCode, languageMap, languageParameter } from '../../languages/Index';

// Text translation task input parameters
type TextTranslationTaskInputParameters = {
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  mode: string;
  depthCount: number;
  forwardCount: number;
  triggerInterval: number;
};

// Text translation microtask input format
type TextTranslationMicrotaskInput = { sentence: string, providedTranslation: string | null | undefined, bow: string | null | undefined };
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
  languageParameter('sourceLanguage', 'Source Language', 'Language of the source sentences'),
  languageParameter('targetLanguage', 'Target Language', 'Language to which sentences must be ranslated'),

  {
    id: 'mode',
    type: 'enum',
    label: 'AI support (none | bow | dropdown)',
    description:
      'Provide support for translation through an ML model. none: No support. bow: Bag of words. dd1: Drop down suggestions with 1 word. dd2: Drop down suggestions with 2 words',
    list: [
      ['none', 'No AI Support'],
      ['static_bow', 'Static Bag of Words (displayed as buttons)'],
      ['dynamic_bow', 'Dynamic Bag of Words (displayed as buttons)'],
      ['dropdown', 'Dropdown suggestions'],
    ],
    required: true,
  },
  {
    id: 'depthCount',
    type: 'int',
    label: 'Number of parralel sentences for providing suggestions (Leave empty for no assistance)',
    description: "Number of sentences to consider in parralel while providing suggestions",
    required: false
  },
  {
    id: 'forwardCount',
    type: 'int',
    label: 'Number of words per sentence for suggestion (Leave empty for no assistance)',
    description: "Number of words to predict ahead",
    required: false
  },
  {
    id: 'triggerInterval',
    type: 'int',
    label: 'Trigger interval',
    description: "Trigger interval for suggestion",
    required: false
  }
];

// Text translation task input file format
const task_input_file: BaseTextTranslationScenario['task_input_file'] = {
  json: {
    required: true,
    description: `JSON file containing an array of objects. 
    Each object must have a sentence field that contains the sentence prompt for the translation, \n 
    an optional providedTranslation field that contains a translation which needs an edit \n
    and an optional bow field that contains a sentence, words for which will be used to provide with static bow assistance`,
    schema: Joi.array().items(Joi.object({ sentence: Joi.string().required(), providedTranslation: Joi.string(), bow: Joi.string() }).unknown(true)),
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
  microtask_input: Joi.object({ sentence: Joi.string().required(), providedTranslation: Joi.string(), bow: Joi.string() }).unknown(true),
  microtask_input_files: [],
  microtask_output: Joi.object({ target: Joi.string().required() }).unknown(true),
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
