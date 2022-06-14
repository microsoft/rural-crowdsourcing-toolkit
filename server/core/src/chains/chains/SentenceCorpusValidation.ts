// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Base implementation of the mv SentenceCorpus validation chain

import { BaseChainInterface } from '../BaseChainInterface';

export const baseSentenceCorpusValidationChain: BaseChainInterface<
  'SENTENCE_CORPUS',
  'SENTENCE_CORPUS_VERIFICATION'
> = {
  name: 'SENTENCE_CORPUS_VALIDATION',
  full_name: 'Sentence Corpus Validation',
  fromScenario: 'SENTENCE_CORPUS',
  toScenario: 'SENTENCE_CORPUS_VERIFICATION',
  blocking: 'EITHER',
  delay: 'EITHER',
  grouping: 'EITHER',
};
