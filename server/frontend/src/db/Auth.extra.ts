// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/** Additional types needed for authentication */

import { RegistrationMechanism } from '@karya/common';

/** Auth header to be attached to each request */
export type AuthHeader = {
  'reg-mechanism': RegistrationMechanism;
  [id: string]: string;
};

/** Auth provider names */
export const AuthProviderName = (apt: RegistrationMechanism | null) => {
  switch (apt) {
    case 'google-id-token':
      return 'Google OAuth2';
    default:
      return 'None';
  }
};
