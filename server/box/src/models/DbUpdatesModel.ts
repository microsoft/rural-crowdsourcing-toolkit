// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Model functions to handle gather/apply updates to DB tables
 */

import { Promise as BBPromise } from 'bluebird';
import box_id from '../config/box_id';
import { this_box } from '../config/ThisBox';
import { DbRecordType, DbTableName, WorkerRecord, tableList, BasicModel } from '@karya/common';
import { handleMicrotaskAssignmentCompletion } from '../scenarios/AssignmentService';
import logger from '../utils/Logger';

// Type for collecting table updates
export type TableUpdates<TableName extends DbTableName> = {
  tableName: TableName;
  rows: DbRecordType<TableName>[];
};

export type WorkerUpdatableTables = 'worker' | 'microtask_group_assignment' | 'microtask_assignment';

const workerUpdatableTables: WorkerUpdatableTables[] = ['worker', 'microtask_group_assignment', 'microtask_assignment'];

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

  const worker_id = worker.id;
  const eon = new Date(0).toISOString();

  // Collect newly assigned microtask_group_assignment updates
  const microtaskGroupAssignmentUpdates = await BasicModel.getRecords(
    'microtask_group_assignment',
    { worker_id, status: 'assigned' },
    { from: from_box }
  );
  updateMap['microtask_group_assignment'] = microtaskGroupAssignmentUpdates;

  // Collect newly assigned microtask_assignment updates
  let microtaskAssignmentUpdates = await BasicModel.getRecords(
    'microtask_assignment',
    { worker_id, status: 'assigned' },
    { from: from_box }
  );
  updateMap['microtask_assignment'] = microtaskAssignmentUpdates;

  // Get all verified microtask_assignments from
  const verifiedMicrotaskAssignments = (
    await BasicModel.getRecords('microtask_assignment', { worker_id, status: 'verified' }, { from: from_server })
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
  const microtaskUpdates = await BasicModel.getRecords('microtask', {}, {}, {}, [['id', microtaskIds]]);
  updateMap['microtask'] = microtaskUpdates;

  // Get all microtask groups corresponding to microtask group assignments
  const microtaskGroupIds = microtaskGroupAssignmentUpdates.map((g) => g.microtask_group_id);
  updateMap['microtask_group'] = await BasicModel.getRecords('microtask_group', {}, {}, {}, [
    ['id', microtaskGroupIds],
  ]);

  let task_ids = microtaskUpdates.map((t) => t.task_id);
  task_ids = [...new Set(task_ids)];

  // Get all tasks updates
  const taskUpdates = await BasicModel.getRecords('task', {}, {}, {}, [['id', task_ids]]);
  updateMap['task'] = taskUpdates;

  // Get all task assignment updates
  const taskAssignmentUpdates = await BasicModel.getRecords('task_assignment', { box_id }, {}, {}, [
    ['task_id', task_ids],
  ]);
  updateMap['task_assignment'] = taskAssignmentUpdates;

  // Get microtask input karya files
  const karya_file_ids = microtaskUpdates.map((m) => m.input_file_id).filter((f): f is string => f !== null);
  const karyaFileUpdates = await BasicModel.getRecords('karya_file', {}, {}, {}, [['id', karya_file_ids]]);
  updateMap['karya_file'] = karyaFileUpdates;

  // Get list of worker-generated karya files uploaded to server
  const uploadedKaryaFiles = await BasicModel.getRecords(
    'karya_file',
    { worker_id, in_server: true },
    { from: from_server }
  );
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
