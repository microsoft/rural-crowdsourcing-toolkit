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
const var_type_arg = process.argv[4] as 'high' | 'low' | 'med';
const date_offset = process.argv[5];

const variant_type = (['high', 'low', 'med'] as const).includes(var_type_arg) ? var_type_arg : null;

if (variant_type == null) {
  throw 'Invalid variant type';
}
// TODO also update credits and base_credits in the same manner as med/high
// Copy only mts created after some time.

/** Main Script */
(async () => {
  setupDbConnection();

  const src_task = (await BasicModel.getSingle('task', { id: src_task_id })) as TaskRecordType;
  const dst_task = (await BasicModel.getSingle('task', { id: dst_task_id })) as TaskRecordType;

  console.log(src_task.name, dst_task.name);

  // Get mts
  const mts = await BasicModel.getRecords(
    'microtask',
    { task_id: src_task_id },
    [],
    [['created_at', date_offset, null]]
  );
  await BBPromise.mapSeries(mts, async (mt) => {
    const { id, created_at, last_updated_at, base_credits, credits, ...rest } = mt;
    var newCredits = credits;
    var newBaseCredits = base_credits;

    if (variant_type == 'med') {
      newCredits = credits * 2;
      newBaseCredits = base_credits * 2;
    }

    if (variant_type == 'high') {
      newCredits = credits * 4;
      newBaseCredits = base_credits * 4;
    }

    const newMt = { ...rest, task_id: dst_task_id, credits: newCredits, base_credits: newBaseCredits };
    const newMtRecord = await BasicModel.insertRecord('microtask', newMt);
  });
})().finally(() => knex.destroy());
