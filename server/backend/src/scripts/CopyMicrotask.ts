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

type PayType = 'low' | 'med' | 'high';

const src_task_id = process.argv[2];
const dst_task_id = process.argv[3];
const var_type_arg = process.argv[4] as PayType;
const date_offset = process.argv[5];

// @ts-ignore
const taskPayRates: { [id in ScenarioName]: { [id in PayType]: number } } = {
  IMAGE_ANNOTATION: {
    low: 0.7,
    med: 1.85,
    high: 3.6,
  },
  SPEECH_DATA: {
    low: 0.2,
    med: 0.55,
    high: 1.2,
  },
  SPEECH_TRANSCRIPTION: {
    low: 1.1,
    med: 2.21,
    high: 4.38,
  },
  SENTENCE_CORPUS: {
    low: 10,
    med: 25,
    high: 50,
  },
};

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
  if (src_task.scenario_name != dst_task.scenario_name) {
    console.log('Mismatch in task types');
    process.exit(0);
  }

  // Get mts
  const mts = await BasicModel.getRecords(
    'microtask',
    { task_id: src_task_id },
    [],
    [['created_at', date_offset, null]]
  );

  await BBPromise.mapSeries(mts, async (mt) => {
    const { id, created_at, last_updated_at, base_credits, credits, ...rest } = mt;

    const payRate = taskPayRates[dst_task.scenario_name][variant_type];
    const newCredits = payRate * 0.25;
    const newBaseCredits = payRate * 0.75;

    const newMt = { ...rest, task_id: dst_task_id, credits: newCredits, base_credits: newBaseCredits };
    const newMtRecord = await BasicModel.insertRecord('microtask', newMt);
  });
})().finally(() => knex.destroy());
