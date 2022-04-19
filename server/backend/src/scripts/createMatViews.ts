// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Script to create materialized views
 */

import dotenv from 'dotenv';
dotenv.config();

import { knex, setupDbConnection, mainLogger as logger } from '@karya/common';
import { createAllMatViews } from '../models/MatViewModel';

/** Main Script to create the MVs */
(async () => {
  logger.info(`Starting create MVs script`);

  setupDbConnection();
  await createAllMatViews();
})().finally(() => knex.destroy());
