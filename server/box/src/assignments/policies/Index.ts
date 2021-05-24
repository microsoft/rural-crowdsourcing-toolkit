// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Entry point for policy module

import { BoxPolicyInterface } from './PolicyInterface';
import { PolicyName } from '@karya/core';

import { nTotalPolicy } from './policies/NTotalPolicy';
import { nUniquePolicy } from './policies/NUniquePolicy';
import { nMatchingPolicy } from './policies/NMatchingPolicy';

/**
 * Policy map
 *
 * Map of policies from name to object.
 */
export const localPolicyMap: { [key in PolicyName]: BoxPolicyInterface<any> } = {
  N_TOTAL: nTotalPolicy,
  N_UNIQUE: nUniquePolicy,
  N_MATCHING: nMatchingPolicy,
};
