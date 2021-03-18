// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Utility to access secrets from Azure Key Vault
 */

import { ManagedIdentityCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';
import config from '../config/Index';

// retreive credentials and create secret client
const credential = new ManagedIdentityCredential();
const vault = config.azureKeyVault;
const url = `https://${vault}.vault.azure.net`;
const client = new SecretClient(url, credential);

/**
 * Function to retrieve a secret from the key vault
 * @param key Name of the secret
 */
export async function getSecretFromVault(key: string) {
  return client.getSecret(key);
}
