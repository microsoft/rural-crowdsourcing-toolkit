// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import dotenv from 'dotenv';
dotenv.config();

import { knex, setupDbConnection, BasicModel } from '@karya/common';

// Main script
(async () => {
  setupDbConnection();
  const taskId = process.argv[2];

  try {
    const task = await BasicModel.getSingle('task', { id: taskId });
    console.log(task);
  } catch (e) {
    console.log(`Invalid task ID '${taskId}'`);
  }
})()
  .catch((err) => {
    console.log(err);
  })
  .finally(() => knex.destroy());
