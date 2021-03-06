// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/** Script to bootstrap authentication */

import config, { loadSecretsFromVault } from '../config/Index';
import { setupDBConnection } from '../db/Client';
import { WorkProvider } from '../db/TableInterfaces.auto';
import * as BasicModel from '../models/BasicModel';
import { getCreationCode } from '../utils/CreationCodeGenerator';
import logger from '../utils/Logger';

/**
 * Function to bootstrap authentication. Creates an admin user and outputs a creation code.
 * The functions checks if there are no work provider records before creating a new record.
 *
 * This function should be run as part of a script.
 */
export async function bootstrapAuth() {
  /** Ensure there are no records */
  const currentRecords = await BasicModel.getRecords('work_provider', {});
  if (currentRecords.length > 0) {
    throw new Error(
      'There are already work provider records. Not bootstrapping',
    );
  }

  /** Get a creation code  */
  const creation_code = getCreationCode();

  /** Create an admin user */
  const workProvider: WorkProvider = {
    admin: true,
    creation_code,
    full_name: '',
    email: '',
    phone_number: '',
  };

  /** Insert the new user */
  const insertedRecord = await BasicModel.insertRecord(
    'work_provider',
    workProvider,
  );

  if (insertedRecord === null) {
    throw new Error('Failed to create record');
  }

  return creation_code;
}
