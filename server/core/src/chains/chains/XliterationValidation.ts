// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Base implementation of the mv xliteration validation chain

import { BaseChainInterface } from '../BaseChainInterface';

export const baseXliterationValidationChain: BaseChainInterface<'XLITERATION_DATA', 'XLITERATION_DATA'> = {
  name: 'XLITERATION_VALIDATION',
  fromScenario: 'XLITERATION_DATA',
  toScenario: 'XLITERATION_DATA',
  blocking: 'EITHER',
  delay: 'EITHER',
  grouping: 'EITHER',
};
