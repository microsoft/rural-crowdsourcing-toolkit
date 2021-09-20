// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Implementation of the sentence corpus verification

import Joi from 'joi';
import { LanguageCode, languageMap, languageParameter } from '../../languages/Index';
import { BaseScenarioInterface } from '../ScenarioInterface';

// Transliteration task input parameters
type SentenceCorpusVerificationTaskInputParameters = {
  language: LanguageCode;
};

// Input/output format
type SentenceCorpusVerificationStatus = 'NEW' | 'VALID' | 'INVALID' | 'UNKNOWN';

type SentenceCorpusVerificationMicrotaskInput = {
  prompt: string;
  sentences: {
    [id: string]: {
      status: SentenceCorpusVerificationStatus;
      message?: string;
    };
  };
};

type SentenceCorpusVerificationMicrotaskOutput = {
  sentences: {
    [id: string]: {
      status: SentenceCorpusVerificationStatus;
      message?: string;
    };
  };
};

// Base transliteration scenario type
export type BaseSentenceCorpusVerificationScenario = BaseScenarioInterface<
  'SENTENCE_CORPUS_VERIFICATION',
  SentenceCorpusVerificationTaskInputParameters,
  SentenceCorpusVerificationMicrotaskInput,
  {},
  SentenceCorpusVerificationMicrotaskOutput,
  {}
>;

// Task parameters
const task_input: BaseSentenceCorpusVerificationScenario['task_input'] = [
  languageParameter('language', 'Language', 'Language of the source words'),
];

// Tranasliteration scenario
export const baseSentenceCorpusVerificationScenario: BaseSentenceCorpusVerificationScenario = {
  name: 'SENTENCE_CORPUS_VERIFICATION',
  full_name: 'Sentence Corpus',
  description: 'This scenario allows verification of a sentence corpus for a set of contexts in a domain',
  task_input,

  task_input_file: {
    json: {
      required: true,
      description: `JSON file containing an array of objects. Each object must contain a prompt field that contains the context for the user and a limit indicating the maximum number of sentences requested for that context.`,
      schema: Joi.array().items(
        Joi.object({ prompt: Joi.string().required(), sentences: Joi.object().required() }).unknown(true)
      ),
    },
    tgz: { required: false },
  },

  // TODO: need better specification of Joi schema
  microtask_input: Joi.object({ prompt: Joi.string().required(), sentences: Joi.object().required() }),
  microtask_input_files: [],
  // TODO: need better specification of Joi schema
  microtask_output: Joi.object({ sentences: Joi.object() }),
  microtask_output_files: [],

  assignment_granularity: 'MICROTASK',
  group_assignment_order: 'EITHER',
  microtask_assignment_order: 'SEQUENTIAL',

  response_type: 'MULTIPLE_OBJECTIVE',

  languageString(task) {
    return languageMap[task.params.language].primary_name;
  },
};
