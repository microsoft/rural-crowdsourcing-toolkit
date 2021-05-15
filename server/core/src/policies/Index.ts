// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Entry point for policy module

import { PolicyInterface } from './PolicyInterface';
import { MicrotaskResponseType } from '../scenarios/Index';

import { nTotalPolicy } from './policies/NTotalPolicy';
import { nUniquePolicy } from './policies/NUniquePolicy';
import { nMatchingPolicy } from './policies/NMatchingPolicy';

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
export const policyMap: { [key in PolicyName]: PolicyInterface } = {
  N_TOTAL: nTotalPolicy,
  N_UNIQUE: nUniquePolicy,
  N_MATCHING: nMatchingPolicy,
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
export const policyList: { [key in MicrotaskResponseType]: PolicyInterface[] } = {
  unique: [nTotalPolicy, nMatchingPolicy],
  'multiple-objective': [nTotalPolicy, nUniquePolicy],
  'multiple-subjective': [nTotalPolicy],
};
