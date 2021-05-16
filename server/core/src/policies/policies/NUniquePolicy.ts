// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// This file implements the n-unique policy. This policy assigns a microtask to n
// workers, and if necessary additional workers, until there are a total of n
// completed assignments each with a unique response for the microtask.

import { BasePolicyInterface } from '../PolicyInterface';

export type NUniquePolicyParams = {
  n: number;
  max: number;
};

export const nUniqueBasePolicy: BasePolicyInterface<NUniquePolicyParams> = {
  name: 'N_UNIQUE',
  full_name: 'n Unique Responses',

  // Policy parameters
  params: [
    {
      id: 'n',
      type: 'int',
      label: 'Number of unique responses',
      description: 'Number of unique responses before which a microtask is deemed complete',
      required: true,
    },
    {
      id: 'max',
      type: 'int',
      label: 'Limit on number of responses',
      description: 'Limit on number of completed responses before which a microtask is deemed complete',
      required: true,
    },
  ],
};
