// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Get updates for this box from the server
 */

import { this_box } from '../config/ThisBox';
import { DbTableName } from '../db/TableInterfaces.auto';
import { applyUpdatesFromServer, TableUpdates } from '../models/DbUpdatesModel';
import { decompress } from '../utils/CompressTools';
import logger from '../utils/Logger';
import { GET } from './HttpUtils';

export async function getUpdatesFromServer() {
  try {
    // Determine the last successful receive time
    const lastReceivedAt = new Date(
      this_box.last_received_from_server_at,
    ).toISOString();
    logger.info(`Last successful receive at ${lastReceivedAt}`);

    // Send request for updates
    const response = await GET(
      '/rbox/updates',
      { from: lastReceivedAt },
      'arraybuffer',
    );

    // Capture the response in a buffer
    const bufferLength = Buffer.byteLength(response);
    const responseBuffer = Buffer.alloc(bufferLength, response);

    // Decompress the updates
    logger.info(`Decompressing updates from the server`);
    let updatesString: string;
    try {
      updatesString = await decompress(responseBuffer);
    } catch (e) {
      throw new Error('Could not decompress updates from the server');
    }

    let updates: TableUpdates<DbTableName>[];
    try {
      updates = JSON.parse(updatesString);
    } catch (e) {
      throw new Error('Failed to parse the udpates JSON');
    }

    if (updates.length === 0) {
      logger.info(`No new updates from the server`);
    } else {
      logger.info(`Applying updates from server`);
      const applyStatus = await applyUpdatesFromServer(updates);
      if (!applyStatus) {
        throw new Error('Error while applying udpates');
      }
    }
    return true;
  } catch (err) {
    logger.error(JSON.stringify(err));
    return false;
  }
}
