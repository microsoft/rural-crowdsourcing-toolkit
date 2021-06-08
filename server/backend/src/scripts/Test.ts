// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Script to reset the database and initialize some basic tables
 */

import dotenv from 'dotenv';
dotenv.config();

import { Promise as BBPromise } from 'bluebird';
import { knex, setupDbConnection, ServerDbFunctions } from '@karya/common';
import { bootstrapAuth } from './AuthBootstrap';
import logger from '../utils/Logger';

/** Main Script to reset the DB */
(async () => {
  setupDbConnection();
  await ServerDbFunctions.createTaskLinkTable();
})().finally(() => knex.destroy());
