// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Entry point for the task chaining module.
//
// Task chaining allows the platform to generate microtasks of a particular task
// from completed assignments of a different task. This concept will enable work
// providers to easily create validationt tasks for their data collection tasks.

import { ScenarioName } from '../scenarios/Index';
import { BaseChainInterface } from './BaseChainInterface';
import { baseSentenceCorpusValidationChain } from './chains/SentenceCorpusValidation';
import { baseSignLanguageVideoValidation } from './chains/SignLanguageVideoValidation';
import { baseSignVideoTranscription } from './chains/SignVideoTranscription';
import { baseSpeechValidationChain } from './chains/SpeechValidation';
import { baseXliterationValidationChain } from './chains/XliterationValidation';

export * from './BaseChainInterface';
export * from './chains/SpeechValidation';
export * from './chains/SignLanguageVideoValidation';
export * from './chains/XliterationValidation';
export * from './chains/SentenceCorpusValidation';
export * from './chains/SignVideoTranscription';

// List of chains
export const chainNames = [
  'SPEECH_VALIDATION',
  'XLITERATION_VALIDATION',
  'SIGN_VIDEO_VALIDATION',
  'SENTENCE_CORPUS_VALIDATION',
  'SIGN_VIDEO_TRANSCRIPTION',
] as const;
export type ChainName = typeof chainNames[number];

/**
 * Chain Status type
 *
 * Defines the current status of a chain.
 *
 * 'ACTIVE': Chain is active and should be executed on completed assignmetns of
 *    the source task
 * 'INACTIVE': Chain is inactive and should not be executed on completed
 *    assignments of the source task
 */
export const chainStatuses = ['ACTIVE', 'INACTIVE'] as const;
export type ChainStatus = typeof chainStatuses[number];

// Chain map
export const baseChainMap: { [key in ChainName]: BaseChainInterface<ScenarioName, ScenarioName> } = {
  SPEECH_VALIDATION: baseSpeechValidationChain,
  XLITERATION_VALIDATION: baseXliterationValidationChain,
  SIGN_VIDEO_VALIDATION: baseSignLanguageVideoValidation,
  SENTENCE_CORPUS_VALIDATION: baseSentenceCorpusValidationChain,
  SIGN_VIDEO_TRANSCRIPTION: baseSignVideoTranscription,
};
