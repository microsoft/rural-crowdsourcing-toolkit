// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// This file implements the n-total policy. This policy assigns a microtask to n
// workers, and if necessary additional workers, until there are a total of n
// completed assignments for the microtask.

import { BasePolicyInterface } from '../PolicyInterface';

export type NTotalPolicyParams = {
  n: number;
};

export const nTotalBasePolicy: BasePolicyInterface<'N_TOTAL', NTotalPolicyParams> = {
  name: 'N_TOTAL',
  full_name: 'n Total Responses',

  // Policy parameters
  params: [
    {
      id: 'n',
      type: 'int',
      label: 'Total number of responses',
      description: 'Number of completed responses before which a microtask is deemed complete',
      required: true,
    },
  ],
};
