// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Process an input file for a task via CLI

import dotenv from 'dotenv';
dotenv.config();

import { knex, setupDbConnection, BasicModel } from '@karya/common';
import { promises as fsp } from 'fs';
import { Promise as BBPromise } from 'bluebird';

const task_id = process.argv[2];
const fix_file = process.argv[3];

/** Main Script */
(async () => {
  setupDbConnection();

  const input_file_data = await fsp.readFile(fix_file);
  const input_data: any[] = JSON.parse(input_file_data.toString());

  const mts = await BasicModel.getRecords('microtask', { task_id }, undefined, undefined, 'id');

  await BBPromise.mapSeries(mts, async (mt, index) => {
    const src_input = input_data[index];
    const mt_input = mt.input;

    const src_input_sentence = src_input.sentence;
    // @ts-ignore
    const mt_input_sentence = mt_input.data.sentence;
    if (src_input_sentence === mt_input_sentence) {
      const new_input_data = { ...src_input, old_sentence: mt_input_sentence };
      await BasicModel.updateSingle(
        'microtask',
        { id: mt.id },
        { input: { data: new_input_data, files: mt_input.files } }
      );
    } else {
      console.log(`Something wrong ${mt.id}`);
    }
  });
})().finally(() => knex.destroy());
