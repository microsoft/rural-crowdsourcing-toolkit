// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Rename the sentence key in speech microtasks

import dotenv from 'dotenv';
dotenv.config();

import { knex, setupDbConnection, setupBlobStore, BasicModel } from '@karya/common';
import { promises as fsp } from 'fs';
import { MicrotaskRecordType, TaskRecordType } from '@karya/core';
import { Promise as BBPromise } from 'bluebird';

const src_task_id = process.argv[2];

/** Main Script */
(async () => {
  setupDbConnection();

  const src_task = (await BasicModel.getSingle('task', { id: src_task_id })) as TaskRecordType;

  console.log(src_task.name);

  // Get mts
  const mts = (await BasicModel.getRecords('microtask', {
    task_id: src_task_id,
  })) as MicrotaskRecordType<'SPEECH_TRANSCRIPTION'>[];
  await BBPromise.mapSeries(mts, async (mt) => {
    // @ts-ignore
    const data = mt.input.data;
    const new_input = { ...mt.input, data: { transcript: data.sentence } };
    await BasicModel.updateSingle('microtask', { id: mt.id }, { input: new_input });
  });
})().finally(() => knex.destroy());
