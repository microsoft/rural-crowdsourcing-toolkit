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
import { backendXliterationDataScenario } from './scenarios/XliterationData';
import { backendSignLanguageVideoVerificationScenario } from './scenarios/SignLanguageVideoVerification';
import { backendImageTranscriptionScenario } from './scenarios/ImageTranscription';
import { backendImageLabellingScenario } from './scenarios/ImageLabelling';

// Local scenario Map
export const backendScenarioMap: {
  [key in ScenarioName]: BackendScenarioInterface<key, any, object, any, object, any>;
} = {
  SPEECH_DATA: backendSpeechDataScenario,
  TEXT_TRANSLATION: backendTextTranslationScenario,
  SPEECH_VERIFICATION: backendSpeechVerificationScenario,
  SIGN_LANGUAGE_VIDEO: backendSignLanguageVideoScenario,
  SGN_LANG_VIDEO_VERIFICATION: backendSignLanguageVideoVerificationScenario,
  XLITERATION_DATA: backendXliterationDataScenario,
  IMAGE_TRANSCRIPTION: backendImageTranscriptionScenario,
  IMAGE_LABELLING: backendImageLabellingScenario,
};
