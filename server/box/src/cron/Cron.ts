// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Cron job to periodically sync box with the server

import dotenv from 'dotenv';
dotenv.config();

import cron from 'node-cron';
import { syncBoxWithServer } from './SyncWithServer';
import { BasicModel, setupDbConnection, karyaLogger, Logger } from '@karya/common';
import { envGetString } from '@karya/misc-utils';
import { Promise as BBPromise } from 'bluebird';

// Cron logger
export const cronLogger: Logger = karyaLogger({
  name: 'cron',
  logToConsole: true,
  consoleLogLevel: 'info',
});

// Get cron interval from the environment
const cronInterval = envGetString('CRON_INTERVAL');

// Status of active cron job
let cronRunning = false;

// setup Db connection
setupDbConnection();

/** Cron job to sync with server */
const cronJob = async () => {
  // If the cron job is running, quit.
  if (cronRunning) {
    cronLogger.info(`Previous cron job is still running. Exiting cron job.`);
    return;
  }

  // set flag
  cronRunning = true;
  cronLogger.info(`Starting cron job to sync with the server`);

  // Get all boxes
  const boxes = await BasicModel.getRecords('box', {});

  // sync each box with server one after the other
  await BBPromise.mapSeries(boxes, async (box) => {
    await syncBoxWithServer(box);
  });

  cronRunning = false;
  return;
};

// Schedule the cron job
cron.schedule(cronInterval, cronJob);

cronJob().catch((e) => console.log(e));
