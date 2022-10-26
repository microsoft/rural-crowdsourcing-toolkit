// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Process an input file for a task via CLI

import dotenv from 'dotenv';
dotenv.config();

import { knex, setupDbConnection, setupBlobStore, BasicModel } from '@karya/common';
import { promises as fsp } from 'fs';
import { processInputFile } from '../task-ops/ops/InputProcessor';
import { TaskRecordType } from '@karya/core';

const task_id = process.argv[2];
const var_type_arg = process.argv[3];

const variant_type = var_type_arg == 'med' ? 'med' : var_type_arg == 'high' ? 'high' : null;
if (variant_type == null) {
  throw 'Invalid variant type';
}

/** Main Script */
(async () => {
  setupDbConnection();

  const lowTask = (await BasicModel.getSingle('task', { id: task_id })) as TaskRecordType;
  const { id, name, params, itags, created_at, last_updated_at, ...rest } = lowTask;

  if (variant_type == 'med') {
    const medParams = { ...params };
    medParams.baseCreditsPerMicrotask = params.baseCreditsPerMicrotask * 2;
    medParams.creditsPerMicrotask = params.creditsPerMicrotask * 2;

    const medTags = itags.itags.filter((t) => t != 'pay-low');
    medTags.push('pay-med');

    const medName = name.replace('Low', 'Med');

    const medTask = { ...rest, name: medName, params: medParams, itags: { itags: medTags } };
    await BasicModel.insertRecord('task', medTask);
  } else if (variant_type == 'high') {
    const highParams = { ...params };
    highParams.baseCreditsPerMicrotask = params.baseCreditsPerMicrotask * 4;
    highParams.creditsPerMicrotask = params.creditsPerMicrotask * 4;

    const highTags = itags.itags.filter((t) => t != 'pay-low');
    highTags.push('pay-high');

    const highName = name.replace('Low', 'High');

    const highTask = { ...rest, name: highName, params: highParams, itags: { itags: highTags } };
    await BasicModel.insertRecord('task', highTask);
  }
})().finally(() => knex.destroy());
