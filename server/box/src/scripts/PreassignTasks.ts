// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Rename the sentence key in speech microtasks

import dotenv from 'dotenv';
dotenv.config();

import { knex, setupDbConnection, BasicModel } from '@karya/common';
import { preassignMicrotasksForWorker } from '../assignments/AssignmentService';

const worker_id = process.argv[2];

/** Main Script */
(async () => {
  setupDbConnection();
  const worker = await BasicModel.getSingle('worker', { id: worker_id });
  await preassignMicrotasksForWorker(worker, 10000);
})()
  .catch((e) => {
    console.log(e);
  })
  .finally(() => knex.destroy());
