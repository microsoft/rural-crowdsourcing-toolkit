// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Types related to policy. Policy names and maps

export const policyNames = ['n-total'] as const;
export type PolicyName = typeof policyNames[number];
