// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Script to reset the database and initialize some basic tables

import dotenv from 'dotenv';
dotenv.config();

import { knex, setupDbConnection, mainLogger as logger, generateAccessCode, AccessCodeInfo, BasicModel } from '@karya/common';
import fs, { promises as fsp } from 'fs';
import { Box, BoxRecord, Worker, WorkerRecord } from '@karya/core';
import { envGetString } from '@karya/misc-utils';

const server_url = envGetString('BACKEND_SERVER_URL', '');
const NUMBER_OF_INTERFACES = 6;
const NUMBER_OF_GROUPS = 3;

(async () => {
  setupDbConnection();

  const nString = process.argv[2];
  if (nString == '' || nString == undefined) {
    console.log('Provide number of workers');
    process.exit();
  }

  const config = process.argv[3];
  if (config == '' || config == undefined) {
    console.log('Provide config file')
    process.exit()
  }

  const configData = await fsp.readFile(config);
  const boxConfig: Box = dotenv.parse(configData);
  let box: BoxRecord;
  try {
    box = await BasicModel.getSingle('box', { access_code: boxConfig.access_code });
  } catch (e) {
    console.log('Invalid box config');
    return;
  }

  const n = Number.parseInt(nString)
  const workersInEachGroup = n/NUMBER_OF_GROUPS

  // Access code info
  const accessCodeInfo: AccessCodeInfo = {
    version: 0,
    length: 8,
    // @ts-ignore
    env: 'prod',
    physical_box: box.physical,
    box_url: box.url || '',
    server_url,
  };

  const workers: WorkerRecord[] = []
  console.log(n)

  for(var idx=0; idx<n; idx++) {
    const groupId = Math.floor((idx)/workersInEachGroup) + 1
    // Get a new acess code
    let access_code: string = '';

    while (true) {
      try {
        access_code = generateAccessCode(accessCodeInfo);
        await BasicModel.getSingle('worker', { access_code });
      } catch (e) {
        // access code does not exist.
        break;
      }
    }

    // Generate a worker record
    const now = new Date().toISOString();
    const tags: string[] = [`A${idx+1}`, `G${groupId}`, "INMT_STUDY"];
    // Populate tags
    for (var i=0; i<NUMBER_OF_INTERFACES; i++) tags.push(`I${i+1}`);
    const createWorker: Worker = {
      access_code: access_code,
      box_id: box.id,
      language: "HI",
      tags: { tags },
      tags_updated_at: now,
    };

    try {
        const workerRecord = await BasicModel.insertRecord('worker', createWorker);
        workers.push(workerRecord)
      } catch (e) {
        console.log(e)
        console.log("HERE")
        break;
      }

  }

  console.log(workers.map(worker => worker.access_code).join('\n'))

})().finally(() => knex.destroy());
