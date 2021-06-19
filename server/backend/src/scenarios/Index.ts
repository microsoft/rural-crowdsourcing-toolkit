// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Entry point for backend scenario functionality. Manages creation and
// execution of task operations: processing input files, and generating output
// files.

import { ScenarioName } from '@karya/core';
import { BackendScenarioInterface } from './ScenarioInterface';

import { backendSpeechDataScenario } from './scenarios/SpeechData';
import { backendTextTranslationScenario } from './scenarios/TextTranslation';
import { backendSpeechVerificationScenario } from './scenarios/SpeechVerification';
import { backendSignLanguageVideoScenario } from './scenarios/SignLanguageVideo';
import { backendMVXliterationScenario } from './scenarios/MVXliteration';
import { backendMVXliterationVerificationScenario } from './scenarios/MVXliterationVerification';

// Local scenario Map
export const backendScenarioMap: {
  [key in ScenarioName]: BackendScenarioInterface<key, any, object, any, object, any>;
} = {
  SPEECH_DATA: backendSpeechDataScenario,
  TEXT_TRANSLATION: backendTextTranslationScenario,
  SPEECH_VERIFICATION: backendSpeechVerificationScenario,
  SIGN_LANGUAGE_VIDEO: backendSignLanguageVideoScenario,
  MV_XLITERATION: backendMVXliterationScenario,
  MV_XLITERATION_VERIFICATION: backendMVXliterationVerificationScenario,
};
