// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Cron job to periodically sync with the server
 */

import * as cron from 'node-cron';

import logger from '../utils/Logger';

import { syncWithServer } from './SyncWithServer';
import { setupDbConnection } from '@karya/db';
import { envGetString } from '@karya/misc-utils';

// Status of active cron job
let cronRunning = false;

setupDbConnection();

/** Cron job to sync with server */
const cronInterval = envGetString('CRON_INTERVAL');
cron.schedule(cronInterval, async () => {
  // If the cron job is running, quit.
  if (cronRunning) {
    logger.info(`Previous cron job is still running. Exiting cron job.`);
    return;
  }

  // set flag
  cronRunning = true;

  logger.info(`Starting cron job to sync with the server`);

  // sync with server
  await syncWithServer();

  cronRunning = false;
  return;
});

// Run sync on start
syncWithServer();
