// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Copy microtask groups from one task to another

import dotenv from 'dotenv';
dotenv.config();

import { knex, setupDbConnection, setupBlobStore, BasicModel } from '@karya/common';
import { promises as fsp } from 'fs';
import { TaskRecordType } from '@karya/core';
import { Promise as BBPromise } from 'bluebird';

const src_task_id = process.argv[2];
const dst_task_id = process.argv[3];

/** Main Script */
(async () => {
  setupDbConnection();

  const src_task = (await BasicModel.getSingle('task', { id: src_task_id })) as TaskRecordType;
  const dst_task = (await BasicModel.getSingle('task', { id: dst_task_id })) as TaskRecordType;

  console.log(src_task.name, dst_task.name);

  // Get mt groups
  const mtgs = await BasicModel.getRecords('microtask_group', { task_id: src_task_id });
  await BBPromise.mapSeries(mtgs, async (mtg) => {
    const { id, created_at, last_updated_at, ...rest } = mtg;
    const newMtg = { ...rest, task_id: dst_task_id };
    const newMtgRecord = await BasicModel.insertRecord('microtask_group', newMtg);

    const mts = await BasicModel.getRecords('microtask', { group_id: mtg.id }, [], [], 'id');
    await BBPromise.mapSeries(mts, async (mt) => {
      const { id, created_at, last_updated_at, ...rest } = mt;
      const newMt = { ...rest, task_id: dst_task_id, group_id: newMtgRecord.id };
      await BasicModel.insertRecord('microtask', newMt);
    });
  });
})().finally(() => knex.destroy());
