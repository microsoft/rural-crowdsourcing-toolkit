// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/** Additional types needed for authentication */

import { AuthProviderType } from './TableInterfaces.auto';

/** Auth header to be attached to each request */
export type AuthHeader = {
  'auth-provider': AuthProviderType;
  'id-token': string;
};

/** Auth provider names */
export const AuthProviderName = (apt: AuthProviderType | null) => {
  switch (apt) {
    case 'google_oauth':
      return 'Google OAuth2';
    default:
      return 'None';
  }
};
