// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Cron job to periodically sync with the server
 */

import * as cron from 'node-cron';

import config from '../config/Index';
import logger from '../utils/Logger';

import { syncWithServer } from './SyncWithServer';

// Status of active cron job
let cronRunning = false;

/** Cron job to sync with server */
cron.schedule(config.cronInterval, async () => {
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
