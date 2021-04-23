// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Azure key vault. This store uses Azure key vault to store secrets. This store
// uses Azure managed identity to connect to the key vault. The virtual machine
// on which the server is running on should have access via managed identity to
// perform "GET" operations on the key vault.

import { SecretsInterface } from '../SecretsInterface';
import { ManagedIdentityCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';

let client: SecretClient;

export const azureKeyVaultStore: SecretsInterface = {
  store: 'azure',
  vars: ['AZURE_KEY_VAULT'],

  // Key vault initializer
  initialize() {
    const credential = new ManagedIdentityCredential();
    const vault = process.env.AZURE_KEY_VAULT;
    const url = `https://${vault}.vault.azure.net`;
    client = new SecretClient(url, credential);
  },

  // Get secret for a specific key
  async getSecret(key) {
    const value = await client.getSecret(key);
    return value.value;
  },
};
