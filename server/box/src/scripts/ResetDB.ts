// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Script to reset the database and initialize some basic tables

import dotenv from 'dotenv';
dotenv.config();

import { knex, setupDbConnection, BoxDbFunctions, mainLogger as logger } from '@karya/common';

/** Main Script to reset the DB */
(async () => {
  logger.info(`Starting reset script DB`);

  // Drop all tables and then create them
  logger.info(`Recreating all tables`);
  setupDbConnection();
  await BoxDbFunctions.dropAllTables();
  await BoxDbFunctions.createAllTables();
  logger.info(`Tables recreated`);
})().finally(() => knex.destroy());
