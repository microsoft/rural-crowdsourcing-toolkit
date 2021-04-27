// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Collect and send all DB updates to the server
 */

import { Promise as BBPromise } from 'bluebird';
import { this_box } from '../config/ThisBox';
import { DbRecordType, DbTableName, BasicModel } from '@karya/common';
import { TableUpdates } from '../models/DbUpdatesModel';
import { compress } from '@karya/compression';
import logger from '../utils/Logger';
import { BackendFetch } from './HttpUtils';

const tableList = [
  'worker',
  'karya_file',
  'task_assignment',
  'microtask_group_assignment',
  'microtask_assignment',
] as const;
type BoxUpdatableTables = typeof tableList[number];

export async function sendUpdatesToServer(sendTime: string) {
  try {
    // Determine last successful send time
    const lastSentAt = new Date(this_box.last_sent_to_server_at).toISOString();
    logger.info(`Last successful send at ${lastSentAt}`);

    const updates: TableUpdates<DbTableName>[] = [];
    const updateMap: { [key in DbTableName]?: DbRecordType<key>[] } = {};

    // Gather all remaining updates
    const remainingTables: BoxUpdatableTables[] = [
      'worker',
      'task_assignment',
      'microtask_group_assignment',
      'microtask_assignment',
    ];
    await BBPromise.mapSeries(remainingTables, async (tableName) => {
      const rows = await BasicModel.getRecords(
        tableName as DbTableName,
        { box_id: this_box.id },
        { from: lastSentAt, to: sendTime }
      );
      // @ts-ignore
      updateMap[tableName] = rows;
    });

    // Push all updates
    tableList.forEach((tableName: DbTableName) => {
      const rows = updateMap[tableName];
      if (rows && rows.length > 0) {
        updates.push({ tableName, rows });
      }
    });

    // Compress the udpates
    const updatesString = JSON.stringify(updates);
    const compressedUpdates = await compress(updatesString);
    await BackendFetch('/rbox/updates', {
      method: 'POST',
      headers: { 'content-type': 'text/octetstream' },
      body: compressedUpdates,
    });

    return true;
  } catch (e) {
    logger.error(`Error while sending updates: ${e.message}`);
    return false;
  }
}
