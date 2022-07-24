// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Base implementation of the speech validation chain

import { BaseChainInterface } from '../BaseChainInterface';

export const baseSpeechTranscriptionValidationChain: BaseChainInterface<
  'SPEECH_TRANSCRIPTION',
  'SPEECH_VERIFICATION'
> = {
  name: 'SPEECH_TRANSCRIPTION_VALIDATION',
  full_name: 'Speech Transcription Validation',
  fromScenario: 'SPEECH_TRANSCRIPTION',
  toScenario: 'SPEECH_VERIFICATION',
  blocking: 'EITHER',
  delay: 'EITHER',
  grouping: 'EITHER',
};
