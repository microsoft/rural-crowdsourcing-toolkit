// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Process an input file for a task via CLI

import dotenv from 'dotenv';
dotenv.config();

import { knex, setupDbConnection, setupBlobStore, BasicModel } from '@karya/common';
import { promises as fsp } from 'fs';
import { processInputFile } from '../task-ops/ops/InputProcessor';
import { ScenarioName, TaskRecordType } from '@karya/core';

type PayType = 'low' | 'med' | 'high';

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

const task_id = process.argv[2];
const var_type_arg = process.argv[3];

const variant_type: PayType | null = var_type_arg == 'med' ? 'med' : var_type_arg == 'high' ? 'high' : null;
if (variant_type == null) {
  throw 'Invalid variant type';
}

/** Main Script */
(async () => {
  setupDbConnection();

  const lowTask = (await BasicModel.getSingle('task', { id: task_id })) as TaskRecordType;
  const { id, name, params, itags, created_at, last_updated_at, ...rest } = lowTask;

  const payRate = taskPayRates[lowTask.scenario_name][variant_type];
  const newParams = { ...params };
  newParams.baseCreditsPerMicrotask = payRate * 0.75;
  newParams.creditsPerMicrotask = payRate * 0.25;

  const newTags = itags.itags.filter((t) => t != 'pay-low');
  newTags.push(`pay-${variant_type}`);

  const newName = name.replace('Low', variant_type == 'high' ? 'High' : 'Med');

  const newTask = { ...rest, name: newName, params: newParams, itags: { itags: newTags } };
  await BasicModel.insertRecord('task', newTask);
})().finally(() => knex.destroy());
