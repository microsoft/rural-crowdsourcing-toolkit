// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Definition of the policy interface. Any newly created policy must
// implement this interface
//
// This Policy interface extends the Policy type by 1) specifying parameters
// that must necessarily be provided for a new policy, and 2) a set of
// functions that should be implemented as part of the newly created scenario.

import { Policy } from '@karya/db';

import { PolicyParameterDefinition } from './ParameterTypes';

export type PolicyValidatorResponse = {
  success: boolean;
  message: string;
};

export interface IPolicy extends Policy {
  // necessary parameters that should be specified at the time of
  // creating a new scenario.

  name: string;
  description: string;
  params: { params: PolicyParameterDefinition[] };
}
