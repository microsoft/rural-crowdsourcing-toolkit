// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import dotenv from 'dotenv';
dotenv.config();

import { InvalidArgumentError, program } from 'commander';
import { knex, setupDbConnection, BasicModel } from '@karya/common';
import { Box, BoxRecord, LanguageCode, languageCodes, Worker, WorkerRecord } from '@karya/core';
import { envGetNumber, envGetString } from '@karya/misc-utils';
import fs, { promises as fsp } from 'fs';
import { Promise as BBPromise } from 'bluebird';
import { AccessCodeInfo, generateAccessCode } from '../access-code/Index';

/** Custom parsers */
function intArg(value: string, dummy: number) {
  const parsed = Number.parseInt(value, 10);
  if (isNaN(parsed)) throw new InvalidArgumentError('Not an integer');
  return parsed;
}

function listArg(value: string, previous: string[] = []) {
  const parsed = value.split(',');
  return previous.concat(parsed);
}

function fileArg(value: string, previous: string) {
  try {
    fs.accessSync(value);
  } catch (e) {
    throw new InvalidArgumentError(`Cannot access file '${value}'`);
  }
  return value;
}

type Options = {
  config: string;
  numCodes: number;
  languageCode: LanguageCode;
  tags: string[];
  tasks: string[];
  wgroup?: string;
  length: number;
  embedVersion: number;
  dryRun: boolean;
};

/** Get some default values from process */
const codeVersion = envGetNumber('ACCESS_CODE_VERSION', 0);
const codeLength = envGetNumber('ACCESS_CODE_LENGTH', 16);
const env = envGetString('ENV', 'prod');
const server_url = envGetString('BACKEND_SERVER_URL', '');

/** Command line arg options */
program
  .requiredOption('-c --config <file>', 'Box config file for which access codes should be generated', fileArg)
  .requiredOption('-n --num-codes <n>', 'Number of access codes that have to be generated', intArg)
  .requiredOption('-l --language-code <code>', 'Language code for the default app language for the workers')
  .option('--tags <tags>', 'Comma seperated list of tags for the workers', listArg, [])
  .option('--tasks <task-ids>', 'Comma seperated list of task IDs', listArg, [])
  .option('--wgroup <worker-group>', 'Worker group to be associated with the workers')
  .option('--length <length>', 'Length of the access codes', intArg, codeLength)
  .option('--embed-version <v>', 'Embedded access code version (0 or 1)', intArg, codeVersion)
  .option('-d --dry-run', 'Dry run. Just print options. Do not create codes.');

export async function generateWorkerCodes(
  box: BoxRecord,
  numCodes: number,
  language: LanguageCode,
  accessCodeInfo: AccessCodeInfo,
  tags: string[],
  wgroup: string | null = null
) {
  // Repeat for num_cc times
  const newWorkers: WorkerRecord[] = [];
  while (newWorkers.length < numCodes) {
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

// Main script
(async () => {
  setupDbConnection();

  program.parse();
  const options: Options = program.opts();
  const { config, languageCode, tags, tasks, embedVersion, length, numCodes, wgroup } = options;

  // Check box config file
  const configData = await fsp.readFile(config);
  const boxConfig: Box = dotenv.parse(configData);
  let box: BoxRecord;
  try {
    box = await BasicModel.getSingle('box', { access_code: boxConfig.access_code });
  } catch (e) {
    console.log('Invalid box config');
    return;
  }

  // Check language code
  if (!languageCodes.includes(languageCode)) {
    console.log(`Need a valid language code`);
    return;
  }

  // Check tasks
  let taskTags: string[] = [];
  let taskError: boolean = false;
  await BBPromise.mapSeries(tasks, async (task_id) => {
    try {
      const task = await BasicModel.getSingle('task', { id: task_id });
      taskTags = taskTags.concat(task.itags.itags);
    } catch (e) {
      console.log(`Invalid task ID '${task_id}'`);
      taskError = true;
    }
  });
  if (taskError) return;
  const workerTags = tags.concat(taskTags).filter((v, i, s) => s.indexOf(v) === i);

  // Access code info
  const accessCodeInfo: AccessCodeInfo = {
    version: embedVersion,
    length,
    // @ts-ignore
    env,
    physical_box: box.physical,
    box_url: box.url || '',
    server_url,
  };

  if (options.dryRun) {
    console.log({ ...options, taskTags });
    return;
  }

  await generateWorkerCodes(box, numCodes, languageCode, accessCodeInfo, workerTags, wgroup);
})()
  .catch((err) => {
    console.log(err);
  })
  .finally(() => knex.destroy());
