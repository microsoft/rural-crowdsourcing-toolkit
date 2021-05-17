// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Entry file for the scenarios

import { BaseScenarioInterface } from './ScenarioInterface';
import { baseSpeechDataScenario } from './scenarios/SpeechData';
import { baseSpeechVerificationScenario } from './scenarios/SpeechVerification';
import { baseTextTranslationScenario } from './scenarios/TextTranslation';

export * from './ScenarioInterface';
export * from './scenarios/SpeechData';
export * from './scenarios/TextTranslation';
export * from './scenarios/SpeechVerification';

// List of scenario names
export const scenarioNames = ['SPEECH_DATA', 'TEXT_TRANSLATION', 'SPEECH_VERIFICATION'] as const;
export type ScenarioName = typeof scenarioNames[number];

export const scenarioMap: { [key in ScenarioName]: BaseScenarioInterface<any, object, any, object, any> } = {
  SPEECH_DATA: baseSpeechDataScenario,
  TEXT_TRANSLATION: baseTextTranslationScenario,
  SPEECH_VERIFICATION: baseSpeechVerificationScenario,
};
