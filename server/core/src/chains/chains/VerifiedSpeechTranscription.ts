// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Base implementation of the speech transcription for verified speech

import { BaseChainInterface } from '../BaseChainInterface';

export const baseVerifiedSpeechTranscriptionChain: BaseChainInterface<'SPEECH_VERIFICATION', 'SPEECH_TRANSCRIPTION'> = {
  name: 'VERIFIED_SPEECH_TRANSCRIPTION',
  full_name: 'Verified Speech Transcription',
  fromScenario: 'SPEECH_VERIFICATION',
  toScenario: 'SPEECH_TRANSCRIPTION',
  blocking: 'EITHER',
  delay: 'EITHER',
  grouping: 'EITHER',
};
