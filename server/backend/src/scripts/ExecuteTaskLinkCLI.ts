// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Execute task link for a task via CLI

import dotenv from 'dotenv';
dotenv.config();

import { knex, setupDbConnection, setupBlobStore, BasicModel } from '@karya/common';
import { promises as fsp } from 'fs';
import { processInputFile } from '../task-ops/ops/InputProcessor';
import { TaskRecordType } from '@karya/core';
import { forwardTaskLinkQ } from '../task-ops/Index';

const task_id = process.argv[2];

/** Main Script */
(async () => {
  setupDbConnection();

  const task = (await BasicModel.getSingle('task', { id: task_id })) as TaskRecordType;
  const taskOp = await BasicModel.insertRecord('task_op', {
    task_id: task.id,
    op_type: 'EXECUTE_FORWARD_TASK_LINK',
    status: 'CREATED',
  });

  await forwardTaskLinkQ.add({ task, taskOp });
})().finally(() => knex.destroy());
