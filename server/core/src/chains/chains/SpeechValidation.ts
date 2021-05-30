// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Base implementation of the speech validation chain

import { BaseChainInterface } from '../BaseChainInterface';

export const baseSpeechValidationChain: BaseChainInterface = {
  name: 'SPEECH_VALIDATION',
  fromScenario: 'SPEECH_DATA',
  toScenario: 'SPEECH_VERIFICATION',
  blocking: 'EITHER',
  delay: 'EITHER',
  grouping: 'EITHER',
};
