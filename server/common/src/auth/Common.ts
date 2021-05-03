// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Common utils for authentication modules

import { SignOptions, VerifyOptions } from 'jsonwebtoken';
import { ParameterizedContext } from 'koa';
import { DbRecordType } from '../Index';

// List of authentication mechanisms
export const authMechanisms = ['access-code', 'karya-id-token'] as const;
export type AuthMechanism = typeof authMechanisms[number];

// List of registration mechanisms
const regMechanisms = ['access-code', 'phone-otp', 'google-id-token'] as const;
export type RegistrationMechanism = typeof regMechanisms[number];

// List of entities that can be authenticated
export type AuthEntity = 'server_user' | 'box' | 'worker';
export type AuthRecord = DbRecordType<AuthEntity>;

// Authentication state to be managed as part of koa context
export type AuthState<E extends AuthEntity = AuthEntity> = {
  auth_mechanism: AuthMechanism | null;
  entity: DbRecordType<E>;
};
export type AuthContext<E extends AuthEntity = AuthEntity> = ParameterizedContext<AuthState<E>>;

// Karya JWT options
export const karyaJWTOptions: SignOptions & VerifyOptions = {
  algorithm: 'HS256',
  audience: 'karya-server',
  issuer: 'karya-server',
};

// Karya JWT payload type
export type KaryaJWTPayload = {
  sub?: string;
  entity?: AuthEntity;
};
