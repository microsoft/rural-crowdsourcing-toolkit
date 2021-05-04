// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// A policy (short for assignment policy) is a specification how microtasks of a
// specific task should be assigned to different users. This file formally
// specifies the interface that should be implemented by any new policy.

import Joi from 'joi';
import { PolicyName } from './Index';

export interface PolicyInterface {
  // Policy name
  name: PolicyName;

  // Full name of the policy
  full_name: string;

  // Parameters to be provided with the policy
  params: Joi.ObjectSchema;
}
