// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Entry point for policy module

import { PolicyInterface } from './PolicyInterface';
import { nTotalPolicy } from './policies/NTotalPolicy';
import { MicrotaskResponseType } from '@karya/scenarios';

// List of policy names
export const policyNames = ['n-total'] as const;

// PolicyName type
export type PolicyName = typeof policyNames[number];

/**
 * Policy map
 *
 * Map of policies from name to object.
 */
export const policyMap: { [key in PolicyName]: PolicyInterface } = {
  'n-total': nTotalPolicy,
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
  unique: [nTotalPolicy],
  'multiple-objective': [nTotalPolicy],
  'multiple-subjective': [nTotalPolicy],
};
