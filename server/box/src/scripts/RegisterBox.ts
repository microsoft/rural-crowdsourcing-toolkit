// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import axios from 'axios';
import * as fs from 'fs';
import { boxInfo } from '../config/BoxInfo';
import config from '../config/Index';
import { knex } from '../db/Client';
import { BoxRecord } from '../db/TableInterfaces.auto';
import logger from '../utils/Logger';

/**
 * Register the box with the server
 * @param boxInfo Box record with required info
 */
async function registerBoxWithServer() {
  try {
    const response = await axios.put<BoxRecord>(
      `${config.serverUrl}/api/box/update/cc`,
      boxInfo,
    );
    logger.info(
      `Successfully registered box with the server. Box ID = ${response.data.id}`,
    );
    return response.data;
  } catch (err) {
    logger.error(err);
    logger.error('Failed to register box');
    process.exit(2);
  }
}

/**
 * Function to verify that there are no other boxes registed in the local DB
 */
async function verifyNoBox() {
  const boxes = await knex<BoxRecord>('box').select();
  if (boxes.length > 0) {
    logger.error('There is already a box registered with this device');
    process.exit(1);
  }
}

/**
 * Function to run the script. Ideally should not be necessary if
 * await can be used in a script
 */
async function runScript() {
  // Ensure that there is no box
  await verifyNoBox();

  const box = await registerBoxWithServer();

  const boxRecord = (
    await knex<BoxRecord>('box').insert(box).returning('*')
  )[0];

  fs.writeFileSync(
    `${process.cwd()}/src/config/box_id.ts`,
    `export default '${boxRecord.id}';`,
  );
  logger.info('Successfully inserted box into local DB');
}

runScript()
  .then(() => {
    logger.info('Script completed successfully.');
  })
  .catch((res) => {
    logger.error(res);
    logger.error('Script failed');
  })
  .finally(() => knex.destroy());
