// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Registration and authentication mechanissm available on the platform

export const registrationMechansisms = ['self-gen-key', 'google-id-token', 'phone-otp'] as const;
export type RegistrationMechanism = typeof registrationMechansisms[number];

export const authMechanisms = ['access-code', 'karya-id-token'] as const;
export type AuthMechanism = typeof authMechanisms[number];
