// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Entry point for auth module

import { DbRecordType, RegistrationMechanism } from '@karya/core';

export { AuthState } from './Common';
export * from './utils/OTPUtils';
export * from './utils/OTPRateLimiter'
export * from './utils/KaryaIDTokenUtils';
export * from './utils/GoogleAuthUtils';

export type UserRegistrationState<EntityType extends 'server_user' | 'worker'> = {
  reg_mechanism: RegistrationMechanism;
  phone_number: string;
  auth_id: string;
  entity: DbRecordType<EntityType>;
};
