// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Process an input file for a task via CLI

import dotenv from 'dotenv';
dotenv.config();

import { knex, setupDbConnection, setupBlobStore, BasicModel } from '@karya/common';
import { ScenarioName, TaskAssignment, TaskRecordType } from '@karya/core';
import { Promise as BBPromise } from 'bluebird';

const simpleTaskId = process.argv[2];
const reverseTaskId = process.argv[3];
const imageTaskId = process.argv[4];

type Week = 'week1' | 'week2' | 'week3' | 'week4';

const taskAssignmentSequence: [Week, string, number][] = [
  ['week1', simpleTaskId, 300],
  ['week1', reverseTaskId, 200],
  ['week1', imageTaskId, 500],
  ['week2', simpleTaskId, 300 * 2],
  ['week2', reverseTaskId, 200 * 2],
  ['week2', imageTaskId, 500 * 2],
  ['week3', simpleTaskId, 300 * 3],
  ['week3', reverseTaskId, 200 * 3],
  ['week3', imageTaskId, 500 * 3],
  ['week4', simpleTaskId, 300 * 4],
  ['week4', reverseTaskId, 200 * 4],
  ['week4', imageTaskId, 500 * 4],
];

/** Main Script */
(async () => {
  setupDbConnection();

  // For each task, loop through and create the necessary task assignments
  await BBPromise.mapSeries(taskAssignmentSequence, async ([weekId, taskId, limit]) => {
    const taskAssignment: TaskAssignment = {
      task_id: taskId,
      box_id: '1',
      policy: 'N_TOTAL',
      status: 'ASSIGNED',
      params: {
        n: 1000,
        maxMicrotasksPerUser: limit,
        tags: [weekId],
      },
    };
    await BasicModel.insertRecord('task_assignment', taskAssignment);
  });
})().finally(() => knex.destroy());
