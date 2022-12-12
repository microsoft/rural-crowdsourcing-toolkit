// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Process an input file for a task via CLI

import dotenv from 'dotenv';
dotenv.config();

import { knex, setupDbConnection, BasicModel } from '@karya/common';
import { promises as fsp } from 'fs';
import { Promise as BBPromise } from 'bluebird';
import { ChainedMicrotaskRecordType } from '../chains/BackendChainInterface';
import { MicrotaskRecordType } from '@karya/core';

const task_id = process.argv[2];

/** Main Script */
(async () => {
  setupDbConnection();

  const mts = (await BasicModel.getRecords(
    'microtask',
    { task_id },
    undefined,
    undefined,
    'id'
  )) as ChainedMicrotaskRecordType<'SPEECH_TRANSCRIPTION'>[];

  await BBPromise.mapSeries(mts, async (mt, index) => {
    const mt_input = mt.input;
    const mt_input_sentence = mt.input.data.sentence;
    const src_mt_id = mt.input.chain.microtaskId;
    const src_mt = (await BasicModel.getSingle('microtask', { id: src_mt_id })) as MicrotaskRecordType<'SPEECH_DATA'>;

    if (src_mt.input.data.sentence === mt_input_sentence) {
      await BasicModel.updateSingle('microtask', { id: mt.id }, { input: { ...mt_input, data: src_mt.input.data } });
    } else {
      console.log(`Something wrong ${mt.id}`);
    }
  });
})().finally(() => knex.destroy());
