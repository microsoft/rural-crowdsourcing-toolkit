// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Base implementation of the sign language video validation chain

import { BaseChainInterface } from '../BaseChainInterface';

export const baseSignLanguageVideoValidation: BaseChainInterface<'SIGN_LANGUAGE_VIDEO', 'SGN_LANG_VIDEO_VERIFICATION'> =
  {
    name: 'SIGN_VIDEO_VALIDATION',
    full_name: 'Sign Langauge Video Validation',
    fromScenario: 'SIGN_LANGUAGE_VIDEO',
    toScenario: 'SGN_LANG_VIDEO_VERIFICATION',
    blocking: 'EITHER',
    delay: 'EITHER',
    grouping: 'EITHER',
  };
