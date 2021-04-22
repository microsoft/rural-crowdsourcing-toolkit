// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Collect and send all DB updates to the server
 */

import { Promise as BBPromise } from 'bluebird';
import { this_box } from '../config/ThisBox';
import { BoxUpdatableTables, DbRecordType, DbTableName, BasicModel } from '@karya/db';
import { TableUpdates } from '../models/DbUpdatesModel';
import { compress } from '@karya/compression';
import logger from '../utils/Logger';
import { BackendFetch } from './HttpUtils';

export async function sendUpdatesToServer(sendTime: string) {
  try {
    const box_id = this_box.id;

    // Determine last successful send time
    const lastSentAt = new Date(this_box.last_sent_to_server_at).toISOString();
    logger.info(`Last successful send at ${lastSentAt}`);

    const updates: TableUpdates<DbTableName>[] = [];
    const updateMap: { [key in BoxUpdatableTables]?: DbRecordType<key>[] } = {};

    // Collect payment updates
    const payoutTables: BoxUpdatableTables[] = ['payout_info', 'payment_request'];
    await BBPromise.mapSeries(payoutTables, async (tableName) => {
      const rows = await BasicModel.getRecords(tableName, { box_id }, {}, { from: lastSentAt });
      // @ts-ignore
      updateMap[tableName] = rows;
    });

    // Gather all remaining updates
    const remainingTables: BoxUpdatableTables[] = [
      'worker',
      'task_assignment',
      'microtask_group_assignment',
      'microtask_assignment',
    ];
    await BBPromise.mapSeries(remainingTables, async (tableName) => {
      const rows = await BasicModel.getRecords(tableName, { box_id: this_box.id }, { from: lastSentAt, to: sendTime });
      // @ts-ignore
      updateMap[tableName] = rows;
    });

    const tableList: BoxUpdatableTables[] = [
      'worker',
      'karya_file',
      'task_assignment',
      'microtask_group_assignment',
      'microtask_assignment',
      'payout_info',
      'payment_request',
    ];

    // Push all updates
    tableList.forEach((tableName) => {
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
