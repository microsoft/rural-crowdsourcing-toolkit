// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Entry point for policy module

import { BasePolicyInterface } from './PolicyInterface';
import { MicrotaskResponseType } from '../scenarios/Index';

import { nTotalBasePolicy, NTotalPolicyParams } from './policies/NTotalPolicy';
import { nUniqueBasePolicy, NUniquePolicyParams } from './policies/NUniquePolicy';
import { nMatchingBasePolicy, NMatchingPolicyParams } from './policies/NMatchingPolicy';

export * from './PolicyInterface';
export * from './policies/NTotalPolicy';
export * from './policies/NUniquePolicy';
export * from './policies/NMatchingPolicy';

// List of policy names
export const policyNames = ['N_TOTAL', 'N_UNIQUE', 'N_MATCHING'] as const;
export type PolicyName = typeof policyNames[number];

/**
 * Policy map
 *
 * Map of policies from name to object.
 */
export const policyMap: { [key in PolicyName]: BasePolicyInterface<key, any> } = {
  N_TOTAL: nTotalBasePolicy,
  N_UNIQUE: nUniqueBasePolicy,
  N_MATCHING: nMatchingBasePolicy,
};

/**
 * Policy list
 *
 * This object maps the list of applicable policies for each possible response
 * type of a scenario. For instance, for a microtask that has a unique response,
 * depending on the nature of the task, we could wait for n responses total, or
 * n unique responses, or n matching responses.
 *
 * The policy will be used when assigning a specific task to a box.
 */
export const policyList: { [key in MicrotaskResponseType]: BasePolicyInterface<PolicyName, any>[] } = {
  UNIQUE: [nTotalBasePolicy, nMatchingBasePolicy],
  MULTIPLE_OBJECTIVE: [nTotalBasePolicy, nUniqueBasePolicy],
  MULTIPLE_SUBJECTIVE: [nTotalBasePolicy],
};

// Utility types for policy
export type PolicyParamsType<PN extends PolicyName> = PN extends 'N_TOTAL'
  ? NTotalPolicyParams
  : PN extends 'N_UNIQUE'
  ? NUniquePolicyParams
  : PN extends 'N_MATCHING'
  ? NMatchingPolicyParams
  : never;
