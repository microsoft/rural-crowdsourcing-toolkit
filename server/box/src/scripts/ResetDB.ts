// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Script to reset the database and initialize some basic tables
 */

import { Promise as BBPromise } from 'bluebird';

import { knex } from '../db/Client';
import { createAllTables } from '../db/CreateTableFunctions.auto';
import { dropAllTables } from '../db/DropTableFunctions.auto';
import logger from '../utils/Logger';

/** Main Script to reset the DB */
(async () => {
  logger.info(`Starting reset script DB`);

  // Drop all tables and then create them
  logger.info(`Recreating all tables`);
  await dropAllTables();
  await createAllTables();
  logger.info(`Tables recreated`);
})().finally(() => knex.destroy());
