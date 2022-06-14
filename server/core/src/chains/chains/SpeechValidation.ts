// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Base implementation of the speech validation chain

import { BaseChainInterface } from '../BaseChainInterface';

export const baseSpeechValidationChain: BaseChainInterface<'SPEECH_DATA', 'SPEECH_VERIFICATION'> = {
  name: 'SPEECH_VALIDATION',
  full_name: 'Speech Validation',
  fromScenario: 'SPEECH_DATA',
  toScenario: 'SPEECH_VERIFICATION',
  blocking: 'EITHER',
  delay: 'EITHER',
  grouping: 'EITHER',
};
