// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Rename the sentence key in speech microtasks

import dotenv from 'dotenv';
dotenv.config();

import { knex, setupDbConnection, BasicModel } from '@karya/common';
import { promises as fsp } from 'fs';
import { preassignMicrotasksForWorker } from '../assignments/AssignmentService';
import { Promise as BBPromise } from 'bluebird';

const worker_id_file = process.argv[2];

/** Main Script */
(async () => {
  setupDbConnection();

  const worker_ids_data = await fsp.readFile(worker_id_file);
  const worker_ids = worker_ids_data.toString().split('\n');

  await BBPromise.mapSeries(worker_ids, async (worker_id) => {
    console.log(new Date().toISOString(), worker_id);
    const worker = await BasicModel.getSingle('worker', { id: worker_id });
    await preassignMicrotasksForWorker(worker, 10000);
    console.log(new Date().toISOString(), worker_id);
  });
})()
  .catch((e) => {
    console.log(e);
  })
  .finally(() => knex.destroy());
