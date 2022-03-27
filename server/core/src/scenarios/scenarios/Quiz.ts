// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Implementation of the quiz scenario. A quiz is a sequence of questions. Each
// question can either be a free form text question or a multiple choice question.

import { BaseScenarioInterface } from '../ScenarioInterface';
import Joi from 'joi';
import { LanguageCode, languageMap, languageParameter } from '../../languages/Index';

// Quiz task input parameters
type QuizTaskInputParameters = {
  language: LanguageCode;
};

// Quiz microtask input format
type TextQuestion = {
  question: string;
  type: 'text';
  long: boolean;
  key: string;
};

type MCQuestion = {
  question: string;
  type: 'mcq';
  options: string[];
  multiple: boolean;
  key: string;
};

type QuizMicrotaskInput = TextQuestion | MCQuestion;

const textQuestion = Joi.object<TextQuestion>({
  type: Joi.string().valid('text').required(),
  question: Joi.string().required(),
  long: Joi.boolean().default(false),
  key: Joi.string().required(),
}).unknown(true);

const mcQuestion = Joi.object<MCQuestion>({
  type: Joi.string().valid('mcq').required(),
  question: Joi.string().required(),
  options: Joi.array().items(Joi.string()).required(),
  multiple: Joi.boolean().default(false),
  key: Joi.string().required(),
}).unknown(true);

type QuizMicrotaskOutput = { [id: string]: any };

// Base speech data scenario type
export type BaseQuizScenario = BaseScenarioInterface<
  'QUIZ',
  QuizTaskInputParameters,
  QuizMicrotaskInput,
  {},
  QuizMicrotaskOutput,
  {}
>;

/**
 * Speech data scenario implementation
 */
export const baseQuizScenario: BaseQuizScenario = {
  name: 'QUIZ',
  full_name: 'Quiz',
  description: 'This scenario allows a quiz to be to given to users.',
  task_input: [languageParameter('language', 'Language', 'Language in which the recordings are collected')],
  task_input_file: {
    json: {
      required: true,
      description: `\
    JSON file containing an array of objects. Each object represents a single text or MC question.\
    `,
      schema: Joi.array().items(textQuestion, mcQuestion),
    },
    tgz: { required: false },
  },
  // @ts-ignore
  microtask_input: Joi.alternatives().try(textQuestion, mcQuestion),
  microtask_input_files: [],
  microtask_output: Joi.object(),
  microtask_output_files: [],
  assignment_granularity: 'MICROTASK',
  group_assignment_order: 'EITHER',
  microtask_assignment_order: 'EITHER',
  response_type: 'MULTIPLE_SUBJECTIVE',

  languageString(task) {
    return languageMap[task.params.language].primary_name;
  },
};
