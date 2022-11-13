// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Process an input file for a task via CLI

import dotenv from 'dotenv';
dotenv.config();

import { knex, setupDbConnection, setupBlobStore, BasicModel } from '@karya/common';
import { ScenarioName, TaskAssignment, TaskRecordType } from '@karya/core';
import { Promise as BBPromise } from 'bluebird';

type Week = 'week1' | 'week2' | 'week3' | 'week4' | 'week5';

// @ts-ignore
const taskAssignmentLimits: { [id in ScenarioName]: { [id in Week]: number | null } } = {
  IMAGE_ANNOTATION: {
    week1: 1304,
    week2: 1304 + 1104,
    week3: 1304 + 1104 + 1104,
    week4: 1304 + 1104 + 1104 + 1104,
    week5: 1304 + 1104 + 1104 + 1104 + 904,
  },

  SPEECH_DATA: {
    week1: 1300,
    week2: 1300 + 1300,
    week3: 1300 + 1300 + 1300,
    week4: 1300 + 1300 + 1300 + 1300,
    week5: 1300 + 1300 + 1300 + 1300 + 1300,
  },

  SPEECH_TRANSCRIPTION: {
    week1: null,
    week2: 875,
    week3: 875 + 875,
    week4: 875 + 875 + 875,
    week5: 875 + 875 + 875 + 875,
  },

  SENTENCE_CORPUS: {
    week1: null,
    week2: null,
    week3: null,
    week4: 25,
    week5: 25 + 25,
  },
};

// @ts-ignore
const week5Limits: { [id in ScenarioName]: { week5: number | null } } = {
  IMAGE_ANNOTATION: {
    week5: 890 + 1104 + 1104 + 490 + 890,
  },

  SPEECH_DATA: {
    week5: 1300 + 1300 + 1300 + 250 + 1300,
  },
};

/** Main Script */
(async () => {
  setupDbConnection();

  const tasks = await BasicModel.getRecords('task', {}, [], [], 'id');
  const currentLimits = taskAssignmentLimits;

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
          n: 1300,
          maxMicrotasksPerUser: limit,
          tags: [week],
        },
      };
      await BasicModel.insertRecord('task_assignment', taskAssignment);
    });
  });
})().finally(() => knex.destroy());
