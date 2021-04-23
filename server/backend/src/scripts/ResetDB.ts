// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Script to reset the database and initialize some basic tables
 */

import { Promise as BBPromise } from 'bluebird';
import { knex, setupDbConnection, createAllTables, dropAllTables, BasicModel } from '@karya/db';
import { languages } from './InitLanguages';
import { bootstrapAuth } from './AuthBootstrap';
import logger from '../utils/Logger';

/**
 * Function to recreate all tables in the database
 */
async function recreateAllTables() {
  // Drop all tables and then create them
  logger.info(`Recreating all tables`);
  await dropAllTables();
  await createAllTables('backend');
  logger.info(`Tables recreated`);
}

/**
 * Function to sync all the languages
 */
async function initializeLanguages() {
  logger.info(`Initializing language records`);
  await BBPromise.mapSeries(languages, async (language) => {
    try {
      await BasicModel.insertRecord('language', language);
    } catch (err) {
      try {
        await BasicModel.updateSingle('language', { name: language.name }, language);
      } catch (e) {
        logger.error(`Failed to sync language '${language.name}'`);
      }
    }
  });
  logger.info(`Completed initializing languages`);
}

/** Script sequence */
let scriptSequence = ['recreate-tables', 'init-languages', 'auth-bootstrap'];

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

  await BBPromise.mapSeries(scriptSequence, async (action) => {
    switch (action) {
      case 'recreate-tables':
        await recreateAllTables();
        break;
      case 'init-languages':
        await initializeLanguages();
        break;
      case 'auth-bootstrap':
        const cc = await bootstrapAuth();
        console.log(cc);
        break;
    }
  });
})().finally(() => knex.destroy());
