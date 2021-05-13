// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Entry point for policy module

import { BoxPolicyInterface } from './PolicyInterface';
import { nTotalPolicy } from './policies/NTotalPolicy';
import { PolicyName } from '@karya/core';

/**
 * Policy map
 *
 * Map of policies from name to object.
 */
export const localPolicyMap: { [key in PolicyName]: BoxPolicyInterface } = {
  'n-total': nTotalPolicy,
};
