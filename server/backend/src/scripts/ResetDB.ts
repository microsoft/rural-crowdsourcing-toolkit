// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Script to reset the database and initialize some basic tables
 */

import dotenv from 'dotenv';
dotenv.config();

import { Promise as BBPromise } from 'bluebird';
import { knex, setupDbConnection, ServerDbFunctions, mainLogger as logger, BasicModel } from '@karya/common';
import { bootstrapAuth } from './AuthBootstrap';
import { createAllMatViews } from '../models/MatViewModel';
// import * as KeycloakUtils from '../utils/auth/KeycloakUtils';

/**
 * Function to recreate all tables in the database
 */
async function recreateAllTables() {
  // Drop all tables and then create them
  logger.info(`Recreating all tables`);
  await ServerDbFunctions.dropAllTables();
  await ServerDbFunctions.createAllTables();
  logger.info(`Tables recreated`);
}

/** Script sequence */
let scriptSequence = ['recreate-tables', 'auth-bootstrap'];

/** Main Script to reset the DB */
(async () => {
  logger.info(`Starting reset script DB`);

  const option = process.argv[2] || 'all';
  if (option !== 'all') {
    if (!scriptSequence.includes(option)) {
      logger.info(
        `Unknown option '${option}' to ResetDB script. Option should be one of '${scriptSequence.join(' ')}'`
      );
      process.exit(1);
    }
    scriptSequence = [option];
  }

  setupDbConnection();

  // Remove server users from keycloak
  // try {
  //   const allServerUsers = await BasicModel.getRecords('server_user', {});
  //   await KeycloakUtils.removeAllUsers();
  // } catch (e) {
  //   logger.warn(e)
  // }


  await BBPromise.mapSeries(scriptSequence, async (action) => {
    switch (action) {
      case 'recreate-tables':
        await recreateAllTables();
        break;
      case 'auth-bootstrap':
        const cc = await bootstrapAuth();
        console.log(cc);
        break;
    }
  });

  await createAllMatViews();
})().finally(() => knex.destroy());
