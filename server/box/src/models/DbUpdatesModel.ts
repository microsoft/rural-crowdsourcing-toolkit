// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Model functions to handle gather/apply updates to DB tables
 */

import { Promise as BBPromise } from 'bluebird';
import { DbRecordType, DbTableName, BasicModel } from '@karya/common';
import logger from '../utils/Logger';

// Type for collecting table updates
export type TableUpdates<TableName extends DbTableName> = {
  tableName: TableName;
  rows: DbRecordType<TableName>[];
};

/**
 * Apply updates to different tables from the server
 * @param updates Updates to tables
 */
export async function applyUpdatesFromServer(updates: TableUpdates<DbTableName>[]): Promise<boolean> {
  // Apply the updates
  let success: boolean = true;
  await BBPromise.mapSeries(updates, async (update) => {
    const { tableName, rows } = update;
    await BBPromise.mapSeries(rows, async (row) => {
      try {
        await BasicModel.upsertRecord(tableName, row);
      } catch (e) {
        // TODO: log some error
        success = false;
        logger.error(`Failed upserting record ${e.toString()}`);
      }
    });
  });

  return success;
}
