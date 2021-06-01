// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Defines the secrets interface.

import { SecretsStore } from './Index';

export interface SecretsInterface {
  // Storage framework used for secrets
  store: SecretsStore;

  // List of environment variables that need to be set
  vars: string[];

  // Initializing function for the store
  initialize(): void;

  // Get secret for a particular key
  getSecret(key: string): Promise<string | undefined>;
}
