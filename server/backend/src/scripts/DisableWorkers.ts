// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Disable a set of access codes

import dotenv from 'dotenv';
dotenv.config();

import { Promise as BBPromise } from 'bluebird';
import { knex, setupDbConnection, BasicModel, WorkerModel } from '@karya/common';
import * as fs from 'fs';

/** Main Script to reset the DB */
(async () => {
  setupDbConnection();

  const accessCodeFile = process.argv[2];
  if (accessCodeFile == '' || accessCodeFile == undefined) {
    console.log('Invalid access code file');
    process.exit();
  }

  const accessCodes = fs.readFileSync(accessCodeFile).toString().split('\n');
  await BBPromise.mapSeries(accessCodes, async (access_code) => {
    try {
      const worker = await BasicModel.getSingle('worker', { access_code });
      await WorkerModel.markDisabled(worker.id);
      console.log(`Disabled: ${access_code}`);
    } catch (e) {
      console.log(`Failed: ${access_code}`);
    }
  });
})().finally(() => knex.destroy());
