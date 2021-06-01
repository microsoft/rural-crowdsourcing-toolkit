// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Entry point for the backend task chaining module

import { ChainName } from '@karya/core';
import { BackendChainInterface } from './BackendChainInterface';
import { speechValidationChain } from './chains/SpeechValidation';

// Backend chain map
export const backendChainMap: { [key in ChainName]: BackendChainInterface<any, any> } = {
  SPEECH_VALIDATION: speechValidationChain,
};
