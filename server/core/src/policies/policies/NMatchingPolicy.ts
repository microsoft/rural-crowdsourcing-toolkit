// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// This file implements the n-matching policy. This policy assigns a microtask to n
// workers, and if necessary additional workers, until there are a total of n
// completed assignments each with n matching responses for the microtask.

import { PolicyInterface } from '../PolicyInterface';

export type NMatchingPolicyParams = {
  n: number;
  max: number;
};

export const nMatchingPolicy: PolicyInterface = {
  name: 'N_MATCHING',
  full_name: 'n Matching Responses',

  // Policy parameters
  params: [
    {
      id: 'n',
      type: 'int',
      label: 'Number of matching responses',
      description: 'Number of matching responses before which a microtask is deemed complete',
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
