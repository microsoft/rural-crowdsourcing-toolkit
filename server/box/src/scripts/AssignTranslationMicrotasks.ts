import dotenv from 'dotenv';
dotenv.config();

import { knex, setupDbConnection, setupBlobStore, BasicModel } from '@karya/common';
import {
    TaskRecordType,
    MicrotaskType,
    MicrotaskRecord,
  } from '@karya/core';
import * as fs from 'fs';
import { Promise as BBPromise } from 'bluebird';

const SET_SIZE = 36;

type TaskMap = {
    baseline: string,
    post_edited: string,
    static_bow: string,
    dynamic_bow: string,
    next_word_bow: string,
    next_word_dropdown: string
}

/** Main Script */
(async () => {
    setupDbConnection();
    const workerIdsFile = process.argv[2];
    const taskIdMapFile = process.argv[3];
  
    if (workerIdsFile == '' || workerIdsFile == undefined) {
      console.log('Invalid worker Ids file');
      process.exit();
    }
  
    if (taskIdMapFile == '' || taskIdMapFile == undefined) {
      console.log('Invalid task Id file');
      process.exit();
    }
    // 1. Read file
  
    const workerIds = fs.readFileSync(workerIdsFile).toString().split('\n');
  
    const taskIdMapString = fs.readFileSync(taskIdMapFile).toString();
    const taskIdMap: TaskMap = JSON.parse(taskIdMapString)

    for(var workerId of workerIds) {
        const worker = await BasicModel.getSingle('worker', {id: workerId})
        for (var key of Object.keys(taskIdMap)) {
            const mtsResponse = await knex.raw(`select * from microtask where task_id = ${taskIdMap[key as keyof TaskMap]} and id not in (select microtask_id from microtask_assignment) limit ${SET_SIZE};`)
            const mts = mtsResponse.rows as  MicrotaskRecord[]
            await BBPromise.mapSeries(mts, async (microtask) => {
                await BasicModel.insertRecord('microtask_assignment', {
                  box_id: worker.box_id,
                  task_id: microtask.task_id,
                  microtask_id: microtask.id,
                  worker_id: worker.id,
                  deadline: microtask.deadline,
                  wgroup: worker.wgroup,
                  max_base_credits: microtask.base_credits,
                  base_credits: 0.0,
                  max_credits: microtask.credits,
                  status: 'ASSIGNED',
                });
              });
        }
    }
    
  })().finally(() => knex.destroy());

