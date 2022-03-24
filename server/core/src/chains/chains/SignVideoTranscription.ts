// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Base implementation of the sign language video transcription

import { BaseChainInterface } from '../BaseChainInterface';

export const baseSignVideoTranscription: BaseChainInterface<'SIGN_LANGUAGE_VIDEO', 'VIDEO_TRANSCRIPTION'> = {
  name: 'SIGN_VIDEO_VALIDATION',
  full_name: 'Sign Video Transcription',
  fromScenario: 'SIGN_LANGUAGE_VIDEO',
  toScenario: 'VIDEO_TRANSCRIPTION',
  blocking: 'EITHER',
  delay: 'EITHER',
  grouping: 'EITHER',
};
