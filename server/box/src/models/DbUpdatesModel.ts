// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Model functions to handle gather/apply updates to DB tables
 */

import { Promise as BBPromise } from 'bluebird';
import box_id from '../config/box_id';
import { this_box } from '../config/ThisBox';
import { DbRecordType, DbTableName, WorkerRecord, tableList, BasicModel } from '@karya/db';
import {
  handleMicrotaskAssignmentCompletion,
  handleMicrotaskGroupAssignmentCompletion,
} from '../scenarios/AssignmentService';
import logger from '../utils/Logger';

// Type for collecting table updates
export type TableUpdates<TableName extends DbTableName> = {
  tableName: TableName;
  rows: DbRecordType<TableName>[];
};

export type WorkerUpdatableTables =
  | 'worker'
  | 'worker_language_skill'
  | 'microtask_group_assignment'
  | 'microtask_assignment';

const workerUpdatableTables: WorkerUpdatableTables[] = [
  'worker',
  'worker_language_skill',
  'microtask_group_assignment',
  'microtask_assignment',
];

/**
 * Gather all updates for a worker
 * @param worker Record corresponding to the worker
 */
export async function getUpdatesForWorker(worker: WorkerRecord): Promise<TableUpdates<DbTableName>[]> {
  const updates: TableUpdates<DbTableName>[] = [];

  // Extract from_box and from_server
  const from_box = worker.last_received_from_box_at;
  const from_server = worker.last_received_from_server_at;

  // Map of all updates
  const updateMap: {
    [key in DbTableName]?: DbRecordType<key>[];
  } = {};

  // Get all updates from the following tables
  const allUpdatesTables: DbTableName[] = [
    'language',
    'scenario',
    'language_resource',
    'language_resource_value',
    'payout_method',
    'policy',
  ];

  // Collect updates for tables which the server could have updated
  await BBPromise.mapSeries(allUpdatesTables, async (table) => {
    // @ts-ignore
    updateMap[table] = await BasicModel.getUpdatesSince(table, from_server);
  });

  // Reorder language_resource updates (string followed by files)
  updateMap['language_resource']?.sort((lr1, lr2) =>
    lr1.type === 'string_resource' || lr2.type === 'file_resource' ? -1 : 1
  );

  const worker_id = worker.id;
  const eon = new Date(0).toISOString();

  // Collect newly assigned microtask_group_assignment updates
  const microtaskGroupAssignmentUpdates = await BasicModel.getUpdatesSince('microtask_group_assignment', from_box, {
    worker_id,
    status: 'assigned',
  });
  updateMap['microtask_group_assignment'] = microtaskGroupAssignmentUpdates;

  // Collect newly assigned microtask_assignment updates
  let microtaskAssignmentUpdates = await BasicModel.getUpdatesSince('microtask_assignment', from_box, {
    worker_id,
    status: 'assigned',
  });
  updateMap['microtask_assignment'] = microtaskAssignmentUpdates;

  // Get all verified microtask_assignments from
  const verifiedMicrotaskAssignments = (
    await BasicModel.getUpdatesSince('microtask_assignment', from_server, {
      worker_id,
      status: 'verified',
    })
  ).map((a) => {
    a.output = {};
    a.output_file_id = null;
    return a;
  });

  updateMap['microtask_assignment'] = (updateMap['microtask_assignment'] || []).concat(verifiedMicrotaskAssignments);

  // App reinstall
  if (from_box == eon) {
    microtaskAssignmentUpdates = microtaskAssignmentUpdates.concat(verifiedMicrotaskAssignments);
  }

  // Get all microtask updates corresponding to microtask assignments
  const microtaskIds = microtaskAssignmentUpdates.map((t) => t.microtask_id);
  const microtaskUpdates = await BasicModel.getRecordsWhereIn('microtask', 'id', microtaskIds);
  updateMap['microtask'] = microtaskUpdates;

  // Get all microtask groups corresponding to microtask group assignments
  const microtaskGroupIds = microtaskGroupAssignmentUpdates.map((g) => g.microtask_group_id);
  updateMap['microtask_group'] = await BasicModel.getRecordsWhereIn('microtask_group', 'id', microtaskGroupIds);

  let task_ids = microtaskUpdates.map((t) => t.task_id);
  task_ids = [...new Set(task_ids)];

  // Get all tasks updates
  const taskUpdates = await BasicModel.getRecordsWhereIn('task', 'id', task_ids);
  updateMap['task'] = taskUpdates;

  // Get all task assignment updates
  const taskAssignmentUpdates = await BasicModel.getRecordsWhereIn('task_assignment', 'task_id', task_ids, { box_id });
  updateMap['task_assignment'] = taskAssignmentUpdates;

  // Get microtask input karya files
  const karya_file_ids = microtaskUpdates.map((m) => m.input_file_id).filter((f): f is string => f !== null);
  const karyaFileUpdates = await BasicModel.getRecordsWhereIn('karya_file', 'id', karya_file_ids);
  updateMap['karya_file'] = karyaFileUpdates;

  // Get list of worker-generated karya files uploaded to server
  const uploadedKaryaFiles = await BasicModel.getUpdatesSince('karya_file', from_server, {
    worker_id,
    in_server: true,
  });
  updateMap['karya_file'] = (updateMap['karya_file'] || []).concat(uploadedKaryaFiles);

  // Collect worker udpates. Set last_received_from_server_at appropriately
  updateMap['worker'] = [
    {
      ...worker,
      last_received_from_server_at: this_box.last_received_from_server_at,
      profile_picture: null,
    },
  ];

  // Push all updates
  tableList.forEach((tableName) => {
    const rows = updateMap[tableName];
    if (rows && rows.length > 0) {
      updates.push({ tableName, rows });
    }
  });

  return updates;
}

/**
 * Apply updates to different tables from the worker
 * @param updates Updates to tables
 */
export async function applyUpdatesFromWorker(worker: WorkerRecord, updates: TableUpdates<WorkerUpdatableTables>[]) {
  // check if there are tables that a worker cannot update
  const forbiddenTables = updates
    .filter((update) => !workerUpdatableTables.includes(update.tableName))
    .map((update) => update.tableName);

  if (forbiddenTables.length > 0) {
    throw new Error(`Worker cannot update tables '${forbiddenTables.join(' ,')}'`);
  }

  // Check if all the rows are updatable by this worker
  updates.forEach(({ tableName, rows }) => {
    if (tableName === 'worker') {
      if (rows.length > 1 || rows[0].id !== worker.id) {
        throw new Error('Worker cannot update other records');
      }
    } else {
      rows.forEach((row) => {
        // @ts-ignore
        if (row.worker_id !== worker.id) {
          throw new Error('Worker can only update their own records');
        }
      });
    }
  });

  // Apply the updates
  // TODO: Do this inside a transaction?
  await BBPromise.mapSeries(updates, async (update) => {
    const { tableName, rows } = update;
    await BBPromise.mapSeries(rows, async (row) => {
      try {
        const { id, ...rowUpdates } = row;
        try {
          await BasicModel.updateSingle(tableName, { id }, rowUpdates);
        } catch (e) {
          logger.error({ tableName, rows });
          logger.error(e);
        }

        if (tableName === 'microtask_assignment') {
          // @ts-ignore
          handleMicrotaskAssignmentCompletion(row);
        } else if (tableName === 'microtask_group_assignment') {
          // @ts-ignore
          handleMicrotaskGroupAssignmentCompletion(row);
        }
      } catch (e) {
        logger.error(e.toString());
        throw new Error(`Failed upserting record ${tableName}, ${row.id}`);
      }
    });
  });
}

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
