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
import { Promise as BBPromise } from 'bluebird';

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

/** Main Script */
(async () => {
  setupDbConnection();

  const tasks = await BasicModel.getRecords('task', {});

  await BBPromise.mapSeries(tasks, async (task) => {
    const tags = task.itags.itags;
    const payType: PayType | null = tags.includes('pay-low')
      ? 'low'
      : tags.includes('pay-med')
      ? 'med'
      : tags.includes('pay-high')
      ? 'high'
      : null;

    if (payType == null) return;

    const payRate = taskPayRates[task.scenario_name][payType];
    console.log(task.name, payType, payRate);

    // Update task
    const params = task.params;
    params.baseCreditsPerMicrotask = payRate * 0.75;
    params.creditsPerMicrotask = payRate * 0.25;
    await BasicModel.updateSingle('task', { id: task.id }, { params });

    // Update all microtasks
    /* await BasicModel.updateRecords(
      'microtask',
      { task_id: task.id },
      { base_credits: payRate * 0.75, credits: payRate * 0.25 }
    );

    // Update all asssigned assignments
    await BasicModel.updateRecords(
      'microtask_assignment',
      { task_id: task.id, status: 'ASSIGNED' },
      { max_base_credits: payRate * 0.75, max_credits: payRate * 0.25 }
    ); */
  });
})().finally(() => knex.destroy());
