// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/** Script to bootstrap authentication */

import { BasicModel } from '@karya/common';
import { ServerUser } from '@karya/core';
import { getCreationCode } from '@karya/misc-utils';

/**
 * Function to bootstrap authentication. Creates an admin user and outputs a creation code.
 * The functions checks if there are no work provider records before creating a new record.
 *
 * This function should be run as part of a script.
 */
export async function bootstrapAuth() {
  /** Ensure there are no records */
  const currentRecords = await BasicModel.getRecords('server_user', {});
  if (currentRecords.length > 0) {
    throw new Error('There are already work provider records. Not bootstrapping');
  }

  /** Get a creation code  */
  const access_code = getCreationCode({
    length: 16,
    numeric: false,
  });

  /** Create an admin user */
  const workProvider: ServerUser = {
    role: 'admin',
    access_code,
    full_name: '',
    email: '',
    phone_number: '',
  };

  /** Insert the new user */
  const insertedRecord = await BasicModel.insertRecord('server_user', workProvider);

  if (insertedRecord === null) {
    throw new Error('Failed to create record');
  }

  return access_code;
}
