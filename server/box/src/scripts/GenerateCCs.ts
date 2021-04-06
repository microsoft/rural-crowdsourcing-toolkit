// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import box_id from '../config/box_id';
import { knex, setupDbConnection, LanguageRecord, Worker, WorkerRecord, BasicModel } from '@karya/db';
import { getCreationCode } from '@karya/misc-utils';
import logger from '../utils/Logger';
import config from '../config/Index';

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

  let language: LanguageRecord | undefined;

  try {
    language = languageCode ? await BasicModel.getSingle('language', { iso_639_3_code: languageCode }) : undefined;
  } catch (e) {
    logger.error(`Unknown language code '${languageCode}'`);
  }

  const params = tags ? { tags } : {};

  // Repeat for num_cc times
  let continuousErrors = 0;
  const newWorkers: WorkerRecord[] = [];
  while (newWorkers.length < numCreationCodes && continuousErrors < 3) {
    // Get a creation code
    const creationCode = getCreationCode({
      length: config.creationCodeLength,
      numeric: true,
    });

    // Generate a worker record
    const createWorker: Worker = {
      creation_code: creationCode,
      box_id,
      full_name: '',
      params,
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

  /**
   * If language is specified, mark the new users as experts
   */
  if (language) {
    for (const worker of newWorkers) {
      await BasicModel.insertRecord('worker_language_skill', {
        worker_id: worker.id,
        language_id: language.id,
        can_read: true,
        can_speak: true,
        can_type: true,
        can_listen: true,
        speak_score: 10,
        read_score: 10,
        type_score: 10,
      });
    }
  }

  for (const worker of newWorkers) {
    console.log(worker.creation_code);
  }

  return true;
}

// Main script
(async () => {
  setupDbConnection(config.dbConfig);

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
