// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Cron job to periodically sync box with the server

import dotenv from 'dotenv';
dotenv.config();

import cron from 'node-cron';
import { syncWithServer } from './ngSyncWithServer';
import { BasicModel, setupDbConnection, knex } from '@karya/common';
import { envGetString } from '@karya/misc-utils';
import { cronLogger } from '../utils/Logger';
import { Promise as BBPromise } from 'bluebird';

// Get cron interval from the environment
const cronInterval = envGetString('CRON_INTERVAL');

// Status of active cron job
let cronRunning = false;

// setup Db connection
setupDbConnection();

/** Cron job to sync with server */
//cron.schedule(cronInterval, async () => {
(async () => {
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
    await syncWithServer(box);
  });

  cronRunning = false;
  return;
})()
  .then(() => console.log('Test successful'))
  .catch((e) => console.log(e))
  .finally(() => knex.destroy());
