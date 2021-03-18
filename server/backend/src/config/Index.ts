// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import IConfig from './IConfig';

import { ManagedIdentityCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';

import localConfig from './Local';

// Load production config if appropriate NODE_ENV
const config: IConfig = localConfig;

/**
 * Load all secrets from the vault.
 */
export async function loadSecretsFromVault() {
  if (config.azureKeyVault === null) {
    return;
  }

  // retreive credentials and create secret client
  const credential = new ManagedIdentityCredential();
  const vault = config.azureKeyVault;
  const url = `https://${vault}.vault.azure.net`;
  const client = new SecretClient(url, credential);

  // Replace azure storage account key
  const blobStoreKey = await client.getSecret(config.blob.key);
  if (!blobStoreKey.value) {
    throw new Error('Could not retrieve blob store key from the key vault');
  }
  config.blob.key = blobStoreKey.value;

  // Replace 2 factor API key
  const apiKey2Factor = await client.getSecret(config.phoneOtp.apiKey);
  if (!apiKey2Factor.value) {
    throw new Error('Could not retrieve 2 factor API key');
  }
  config.phoneOtp.apiKey = apiKey2Factor.value;
}

export default config;
