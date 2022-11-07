// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Process an input file for a task via CLI

import dotenv from 'dotenv';
dotenv.config();

import { knex, setupDbConnection, setupBlobStore, BasicModel } from '@karya/common';
import { ScenarioName, TaskAssignment, TaskRecordType } from '@karya/core';
import { Promise as BBPromise } from 'bluebird';
import { t } from 'tar';

type Week = 'week1' | 'week2' | 'week3' | 'week4';

// @ts-ignore
const taskAssignmentLimits: { [id in ScenarioName]: { [id in Week]: number | null } } = {
  IMAGE_ANNOTATION: {
    week1: 890,
    week2: 890 + 690,
    week3: 890 + 690 + 690,
    week4: 890 + 690 + 690 + 490,
  },

  SPEECH_DATA: {
    week1: 1000,
    week2: 1000 + 1000,
    week3: 1000 + 1000 + 1000,
    week4: 1000 + 1000 + 1000 + 250,
  },

  SPEECH_TRANSCRIPTION: {
    week1: null,
    week2: 580,
    week3: 580 + 580,
    week4: 580 + 580 + 590,
  },

  SENTENCE_CORPUS: {
    week1: null,
    week2: null,
    week3: 25,
    week4: 25 + 25,
  },
};

// @ts-ignore
const week5Limits: { [id in ScenarioName]: { week5: number | null } } = {
  IMAGE_ANNOTATION: {
    week5: 890 + 690 + 690 + 490 + 890,
  },

  SPEECH_DATA: {
    week5: 1000 + 1000 + 1000 + 250 + 1000,
  },
};

/** Main Script */
(async () => {
  setupDbConnection();

  const tasks = await BasicModel.getRecords('task', {}, [], [], 'id');
  const currentLimits = week5Limits;

  // For each task, loop through and create the necessary task assignments
  await BBPromise.mapSeries(tasks, async (task) => {
    // Return if task is completed
    if (task.status == 'COMPLETED') return;

    // Return if scenario does not have limits
    if (!(task.scenario_name in currentLimits)) return;

    // Get the limits
    const limits = Object.entries(currentLimits[task.scenario_name]);

    // Create the limit
    await BBPromise.mapSeries(limits, async ([week, limit]) => {
      if (limit == null) return;
      const taskAssignment: TaskAssignment = {
        task_id: task.id,
        box_id: '1',
        policy: 'N_TOTAL',
        status: 'ASSIGNED',
        params: {
          n: 1000,
          maxMicrotasksPerUser: limit,
          tags: [week],
        },
      };
      await BasicModel.insertRecord('task_assignment', taskAssignment);
    });
  });
})().finally(() => knex.destroy());
