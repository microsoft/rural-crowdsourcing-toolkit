// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Script to reset the database and initialize some basic tables
 */

import { knex, setupDbConnection, createAllTables, dropAllTables } from '@karya/db';
import config from '../config/Index';
import logger from '../utils/Logger';

/** Main Script to reset the DB */
(async () => {
  logger.info(`Starting reset script DB`);

  // Drop all tables and then create them
  logger.info(`Recreating all tables`);
  setupDbConnection(config.dbConfig);
  await dropAllTables();
  await createAllTables('box');
  logger.info(`Tables recreated`);
})().finally(() => knex.destroy());
