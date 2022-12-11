// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Create dummy microtask assignments for past weeks when users have not received enough assignments

import dotenv from 'dotenv';
dotenv.config();

import { knex, setupDbConnection, BasicModel } from '@karya/common';
import { Promise as BBPromise } from 'bluebird';
import { MicrotaskAssignment, WorkerRecord } from '@karya/core';
import cron from 'node-cron';

const realRun = process.argv[2] == 'r';

const taskIdMaps: { [id in string]: string[] } = {
  'bengali-general': ['805', '806', '807'],
  'bengali-no-child': ['811', '812', '807'],
  'hindi-general': ['808', '809', '810'],
  'hindi-no-child': ['813', '814', '810'],
};

const taskCount = [300, 200, 500];

export async function createDummyAssignmentsForWorker(worker: WorkerRecord) {
  // Determine worker week
  const regTime = new Date(worker.registered_at).getTime();
  const currentTime = Date.now();
  const diffMilli = currentTime - regTime;
  const diffWeeks = Math.floor(diffMilli / 1000 / 3600 / 24 / 7);
  const weekId = diffWeeks;

  const result = await knex.raw(
    `select 
        task_id, 
        sum(week1::int) as w1, 
        sum(week2::int) as w2, 
        sum(week3::int) as w3, 
        sum(week4::int) as w4 
      from 
        (
          select 
            mta.worker_id, 
            mta.task_id, 
            mta.created_at < w.registered_at + interval '7 days' as week1, 
            mta.created_at < w.registered_at + interval '14 days' as week2, 
            mta.created_at < w.registered_at + interval '21 days' as week3, 
            mta.created_at < w.registered_at + interval '28 days' as week4 
          from microtask_assignment as mta 
          left join worker as w 
          on mta.worker_id = w.id 
          where 
            worker_id=${worker.id}
        ) as summary 
      group by task_id, worker_id;`
  );

  const lang = worker.tags.tags.includes('bengali') ? 'bengali' : 'hindi';
  const wtype = worker.tags.tags.includes('general') ? 'general' : 'no-child';
  const taskMap = taskIdMaps[`${lang}-${wtype}`];

  const assignedMap: { [id in number]: { [id in string]: number } } = { 0: {}, 1: {}, 2: {}, 3: {} };
  // @ts-ignore
  result.rows.forEach(({ task_id, w1, w2, w3, w4 }) => {
    assignedMap[0][task_id] = Number.parseInt(w1);
    assignedMap[1][task_id] = Number.parseInt(w2);
    assignedMap[2][task_id] = Number.parseInt(w3);
    assignedMap[3][task_id] = Number.parseInt(w4);
  });

  const expireList = [];
  for (let i = 0; i < weekId; i++) {
    const currentAssigned = assignedMap[i];
    for (let j = 0; j < 3; j++) {
      let assigned = currentAssigned[taskMap[j]] ?? 0;
      if (assigned < taskCount[j] * i) assigned = taskCount[j] * i;
      const excess = taskCount[j] * (i + 1) - assigned;
      if (!isNaN(excess) && excess > 0) {
        expireList.push([worker.id, taskMap[j], i, excess]);
      }
    }
  }

  await BBPromise.mapSeries(expireList, async ([worker_id, task_id, week_id, excess]) => {
    // @ts-ignore
    const dummyTime = new Date(regTime + (week_id * 7 + 6) * 24 * 60 * 60 * 1000).toISOString();
    if (realRun) {
      await BBPromise.mapSeries(Array.from(Array(excess).keys()), async (i) => {
        const mta: MicrotaskAssignment = {
          box_id: '1',
          // @ts-ignore
          worker_id,
          // @ts-ignore
          task_id,
          microtask_id: '0',
          status: 'EXPIRED',
          max_base_credits: 0.0,
          base_credits: 0.0,
          max_credits: 0.0,
          credits: 0.0,
          created_at: dummyTime,
        };
        await BasicModel.insertRecord('microtask_assignment', mta);
      });
    }
    if (!module.parent) {
      console.log(worker_id, task_id, week_id, excess);
    }
  });
}

const createDummyAssignments = async () => {
  // Get all relevant worker records
  const workers = await BasicModel.getRecords('worker', {});
  const r2workers = workers.filter((w) => w.reg_mechanism != null && w.tags.tags.includes('round2'));

  await BBPromise.mapSeries(r2workers, async (worker) => {
    await createDummyAssignmentsForWorker(worker);
  });
};

if (!module.parent) {
  setupDbConnection();

  cron.schedule('30 22 * * *', createDummyAssignments);

  /** Main Script */
  createDummyAssignments().finally(() => knex.destroy());
}
