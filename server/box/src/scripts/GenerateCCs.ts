// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import box_id from '../config/box_id';
import { knex, setupDbConnection, Worker, WorkerRecord, BasicModel } from '@karya/common';
import { getCreationCode } from '@karya/misc-utils';
import logger from '../utils/Logger';

export async function generateWorkerCCs(
  numCreationCodes: number,
  tags: string[] | undefined,
  languageCode: string | undefined
): Promise<boolean> {
  // Check for valid request
  if (!(box_id && numCreationCodes)) {
    logger.info('Need to specify box ID and number of codes');
    return false;
  }

  const extras = tags ? { tags } : {};

  // Repeat for num_cc times
  let continuousErrors = 0;
  const newWorkers: WorkerRecord[] = [];
  while (newWorkers.length < numCreationCodes && continuousErrors < 3) {
    // Get a creation code
    const creationCode = getCreationCode({
      length: 16,
      numeric: true,
    });

    // Generate a worker record
    const createWorker: Worker = {
      access_code: creationCode,
      box_id,
      full_name: '',
      extras,
    };

    try {
      const workerRecord = await BasicModel.insertRecord('worker', createWorker);
      newWorkers.push(workerRecord);
      continuousErrors = 0;
    } catch (e) {
      continuousErrors += 1;
    }

    // Check if there is a continuous error
    // DB server is possibly down
    if (continuousErrors == 3) {
      logger.info('Request failed');
      return false;
    }
  }

  for (const worker of newWorkers) {
    console.log(worker.access_code);
  }

  return true;
}

// Main script
(async () => {
  setupDbConnection();

  const numCreationCodes = Number.parseInt(process.argv[2], 10);
  if (isNaN(numCreationCodes)) {
    logger.info(`Need valid input for number of creation codes.`);
    logger.info(`USAGE: ${process.argv[0]} ${process.argv[1]} <num-codes>`);
  }

  let tags: string[] | undefined = process.argv[3]?.split(',');
  if (tags) {
    tags = tags.length == 0 ? undefined : tags;
  }

  const languageCode = process.argv[4];

  const result = await generateWorkerCCs(numCreationCodes, tags, languageCode);
  return result;
})()
  .then((res) => {
    if (res) {
      logger.info('Script completed successfully.');
    } else {
      logger.info('Script failed');
    }
  })
  .finally(() => knex.destroy());
