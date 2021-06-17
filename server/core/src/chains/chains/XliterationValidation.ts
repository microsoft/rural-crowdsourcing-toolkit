// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Base implementation of the mv xliteration validation chain

import { BaseChainInterface } from '../BaseChainInterface';

export const baseXliterationValidationChain: BaseChainInterface<'MV_XLITERATION', 'MV_XLITERATION_VERIFICATION'> = {
  name: 'XLITERATION_VALIDATION',
  fromScenario: 'MV_XLITERATION',
  toScenario: 'MV_XLITERATION_VERIFICATION',
  blocking: 'EITHER',
  delay: 'EITHER',
  grouping: 'EITHER',
};
