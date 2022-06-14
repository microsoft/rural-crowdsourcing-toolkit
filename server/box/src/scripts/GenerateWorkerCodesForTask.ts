// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import dotenv from 'dotenv';
dotenv.config();

import { knex, setupDbConnection, BasicModel } from '@karya/common';
import { Box, BoxRecord, LanguageCode, languageCodes, Worker, WorkerRecord } from '@karya/core';
import { getCreationCode } from '@karya/misc-utils';
import { promises as fsp } from 'fs';

export async function generateWorkerCodes(
  box: BoxRecord,
  numCodes: number,
  language: LanguageCode,
  taskId: string,
  wgroup: string | null = null
) {
  let tags: string[];
  // Get task itags
  try {
    const task = await BasicModel.getSingle('task', { id: taskId });
    tags = task.itags.itags;
  } catch (e) {
    console.log(`Invalid task id ${taskId}`);
    return;
  }

  // Repeat for num_cc times
  const newWorkers: WorkerRecord[] = [];
  while (newWorkers.length < numCodes) {
    // Get a new acess code
    let access_code: string = '';

    while (true) {
      try {
        access_code = getCreationCode({ length: 16, numeric: true });
        await BasicModel.getSingle('worker', { access_code });
      } catch (e) {
        // access code does not exist.
        break;
      }
    }

    // Generate a worker record
    const createWorker: Worker = {
      access_code,
      box_id: box.id,
      language,
      tags: { tags },
      wgroup,
    };

    try {
      const workerRecord = await BasicModel.insertRecord('worker', createWorker);
      newWorkers.push(workerRecord);
    } catch (e) {
      console.log('Failed to insert worker.');
      break;
    }
  }

  for (const worker of newWorkers) {
    console.log(worker.access_code);
  }
}

// Print script usage and exit
function printUsage() {
  console.log(
    `USAGE: ${process.argv[0]} ${process.argv[1]} <box-config> <num-codes> <language-code> <task-id> <wgroup>`
  );
  process.exit(0);
}

// Main script
(async () => {
  setupDbConnection();

  const boxConfigFile = process.argv[2];
  const numCodesString = process.argv[3];
  const languageCode = process.argv[4] as LanguageCode;
  const taskId = process.argv[5];
  const wgroup = process.argv[6] ?? null;

  // Check box config file
  const configData = await fsp.readFile(boxConfigFile);
  const boxConfig: Box = dotenv.parse(configData);
  let box: BoxRecord;
  try {
    box = await BasicModel.getSingle('box', { access_code: boxConfig.access_code });
  } catch (e) {
    printUsage();
    return;
  }

  const numCodes = Number.parseInt(numCodesString, 10);
  if (isNaN(numCodes)) {
    console.log(`Need valid input for number of access codes.`);
    printUsage();
  }

  if (!languageCodes.includes(languageCode)) {
    console.log(`Need a valid language code`);
    printUsage();
  }

  await generateWorkerCodes(box, numCodes, languageCode, taskId, wgroup);
})()
  .catch((err) => {
    console.log(err);
  })
  .finally(() => knex.destroy());
