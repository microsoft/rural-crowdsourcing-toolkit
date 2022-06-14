// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Implementation of the sentence corpus

import Joi from 'joi';
import { LanguageCode, languageMap, languageParameter } from '../../languages/Index';
import { BaseScenarioInterface } from '../ScenarioInterface';

// Transliteration task input parameters
type SentenceCorpusTaskInputParameters = {
  language: LanguageCode;
  limit: number;
};

// Input/output format
type SentenceCorpusStatus = 'NEW' | 'VALID' | 'INVALID' | 'UNKNOWN';

type SentenceCorpusMicrotaskInput = {
  prompt: string;
  limit?: number;
  sentences: {
    [id: string]: {
      status: SentenceCorpusStatus;
      message?: string;
    };
  };
};

type SentenceCorpusMicrotaskOutput = {
  sentences: {
    [id: string]: {
      status: SentenceCorpusStatus;
    };
  };
};

// Base transliteration scenario type
export type BaseSentenceCorpusScenario = BaseScenarioInterface<
  'SENTENCE_CORPUS',
  SentenceCorpusTaskInputParameters,
  SentenceCorpusMicrotaskInput,
  {},
  SentenceCorpusMicrotaskOutput,
  {}
>;

// Task parameters
const task_input: BaseSentenceCorpusScenario['task_input'] = [
  languageParameter('language', 'Language', 'Language of the source words'),

  {
    id: 'limit',
    type: 'int',
    label: 'Limit on variants',
    description: 'Limit on the number of variants that can be added',
    required: true,
  },
];

// Tranasliteration scenario
export const baseSentenceCorpusScenario: BaseSentenceCorpusScenario = {
  name: 'SENTENCE_CORPUS',
  full_name: 'Sentence Corpus',
  description: 'This scenario allows collection of a sentence corpus for a set of contexts in a domain',
  task_input,

  task_input_file: {
    json: {
      required: true,
      description: `JSON file containing an array of objects. Each object must contain a prompt field that contains the context for the user and a limit indicating the maximum number of sentences requested for that context.`,
      schema: Joi.array().items(Joi.object({ prompt: Joi.string().required(), limit: Joi.number() }).unknown(true)),
    },
    tgz: { required: false },
  },

  // TODO: need better specification of Joi schema
  microtask_input: Joi.object({ prompt: Joi.string().required(), limit: Joi.number() }),
  microtask_input_files: [],
  // TODO: need better specification of Joi schema
  microtask_output: Joi.object({ sentences: Joi.object() }),
  microtask_output_files: [],

  assignment_granularity: 'MICROTASK',
  group_assignment_order: 'EITHER',
  microtask_assignment_order: 'EITHER',

  response_type: 'MULTIPLE_OBJECTIVE',

  languageString(task) {
    return languageMap[task.params.language].primary_name;
  },
};
