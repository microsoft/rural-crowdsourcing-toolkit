// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Base implementation of the speech transcription chain

import { BaseChainInterface } from '../BaseChainInterface';

export const baseSpeechTranscriptionChain: BaseChainInterface<'SPEECH_DATA', 'SPEECH_TRANSCRIPTION'> = {
  name: 'SPEECH_VALIDATION',
  full_name: 'Speech Transcription',
  fromScenario: 'SPEECH_DATA',
  toScenario: 'SPEECH_TRANSCRIPTION',
  blocking: 'EITHER',
  delay: 'EITHER',
  grouping: 'EITHER',
};
