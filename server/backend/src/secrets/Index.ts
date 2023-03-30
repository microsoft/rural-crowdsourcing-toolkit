// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Entry point for the secrets module

import { azureKeyVaultStore } from './stores/AzureKeyVault';

const secretsStore = ['none', 'azure'] as const;
export type SecretsStore = typeof secretsStore[number];

/**
 * Load a list of secrets from the vault.
 * @param vars List of environment variables that should be fetched from the
 *   secrets store. The current value of the environment variable is used at the
 *   key to fetch the value from the store.
 */
export async function loadSecrets(vars: string[]) {
  // Fetch the secret store from env.
  const envStore = (process.env.SECRETS_STORE as SecretsStore) ?? 'none';

  switch (envStore) {
    case 'none':
      // Nothing to do
      return;

    case 'azure':
      azureKeyVaultStore.initialize();
      for (const key of vars) {
        const value = await azureKeyVaultStore.getSecret(key);
        if (!value) {
          throw new Error(`Could not fetch secret value for '${key}'`);
        }
        process.env[key] = value;
      }
      return;

    default:
      ((obj: never) => {
        throw new Error(`Invalid secret store '${obj}'`);
      })(envStore);
  }
}
