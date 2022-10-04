// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Receive files and information from the server

import { BasicModel, knex, WorkerModel } from '@karya/common';
import {
  BoxRecord,
  KaryaFileRecord,
  MicrotaskAssignmentRecord,
  MicrotaskGroupRecord,
  MicrotaskRecord,
  TaskAssignmentRecord,
  TaskRecord,
  WorkerRecord,
  getChecksum,
  PaymentsAccountRecord,
  PaymentsTransactionRecord,
} from '@karya/core';
import { Promise as BBPromise } from 'bluebird';
import axios, { AxiosInstance } from 'axios';
import { cronLogger } from './Cron';
import { envGetString } from '@karya/misc-utils';
import fs from 'fs';
import { fips } from 'crypto';

export async function getLanguageAssets(axiosLocal: AxiosInstance) {
  cronLogger.info('Fetching language assets');

  // Get latest updated time for language assets
  const response = await knex<KaryaFileRecord>('karya_file')
    .where({ container_name: 'language-assets' })
    .max('last_updated_at');
  const latest_update_time = response[0].max || new Date(0).toISOString();

  let languageAssets: KaryaFileRecord[];
  try {
    const response = await axiosLocal.get<KaryaFileRecord[]>('/language_assets', {
      params: { from: latest_update_time },
    });
    languageAssets = response.data;
  } catch (e) {
    cronLogger.error('Error while fetching language assets');
    return;
  }

  // Update language asset information in the box
  try {
    await BBPromise.mapSeries(languageAssets, async (asset) => {
      await BasicModel.upsertRecord('karya_file', asset);
    });
  } catch (e) {
    cronLogger.error('Error while updating language assets');
    return;
  }
}

/**
 * Get all workers whose tags have been updated
 *
 * Look for disabled workers. Their assignments have to be marked as expired.
 */
export async function getUpdatedWorkers(axiosLocal: AxiosInstance) {
  // Get the latest time tags were updated
  const response = await knex<WorkerRecord>('worker').max('tags_updated_at');
  const latest_tag_updated_time = response[0].max || new Date(0).toISOString();

  // Response type for get updated workes query
  type UpdatedWorkerRespnse = Pick<
    WorkerRecord,
    'id' | 'tags' | 'tags_updated_at' | 'payments_active' | 'payments_meta' | 'selected_account'
  >[];

  // Get updated workers
  let updatedWorkerData: WorkerRecord[];
  try {
    const response = await axiosLocal.get<WorkerRecord[]>('/workers', {
      params: { from: latest_tag_updated_time },
    });
    updatedWorkerData = response.data;
  } catch (e) {
    cronLogger.error(`Failed to receive updated workers`);
    return;
  }

  // Update tag and payment information for workers
  try {
    await BBPromise.mapSeries(updatedWorkerData, async (worker) => {
      const { id, tags, tags_updated_at, payments_active, payments_meta, selected_account } = worker;
      try {
        await BasicModel.updateSingle(
          'worker',
          { id },
          { tags, tags_updated_at, payments_active, payments_meta, selected_account }
        );
      } catch (e) {
        await BasicModel.upsertRecord('worker', worker);
      }

      // If the worker is disabled, mark all their 'ASSIGNED'
      // assignments as EXPIRED
      if (WorkerModel.isDisabled(worker)) {
        await BasicModel.updateRecords(
          'microtask_assignment',
          { worker_id: id, status: 'ASSIGNED' },
          { status: 'EXPIRED' }
        );
      }
    });
  } catch (e) {
    cronLogger.error(`Failed to update tag information about workers`);
  }
}

/**
 * Get all (new/updated) task assignments for this box
 * @param box Box record
 * @param axiosLocal Axios instance with defaults
 */
export async function getTaskAssignments(box: BoxRecord, axiosLocal: AxiosInstance) {
  // Get latest receive time on task assignments
  const response = await knex<TaskAssignmentRecord>('task_assignment').max('received_from_server_at');
  const latest_receive_time = response[0].max || new Date(0).toISOString();

  // Response type for task assignment query
  type TaskAssignmentResponse = {
    tasks: TaskRecord[];
    task_assignments: TaskAssignmentRecord[];
  };

  let assignmentData: TaskAssignmentResponse;
  try {
    const response = await axiosLocal.get<TaskAssignmentResponse>('/task_assignments', {
      params: { from: latest_receive_time },
    });
    assignmentData = response.data;
  } catch (e) {
    cronLogger.error('Failed to receive task assignments');
    return;
  }

  // Upsert the task assignments and tasks
  try {
    const { task_assignments, tasks } = assignmentData;
    if (task_assignments.length + tasks.length == 0) {
      cronLogger.info('No new task assignments or tasks');
      return;
    }

    // Perhaps this can be done in bulk?
    await BBPromise.mapSeries(tasks, async (task) => {
      await BasicModel.upsertRecord('task', task);
    });
    await BBPromise.mapSeries(task_assignments, async (task_assignment) => {
      await BasicModel.upsertRecord('task_assignment', task_assignment);
    });
    cronLogger.info('Received new task assignments');
  } catch (e) {
    cronLogger.error('Faield to update local task assignments and tasks');
    return;
  }
}

/**
 * Get new microtasks for incomplete task assignments
 */
export async function getMicrotasks(box: BoxRecord, axiosLocal: AxiosInstance) {
  cronLogger.info(`Getting new microtasks for tasks`);
  // Get incomplete task assignments
  const task_assignments = await BasicModel.getRecords('task_assignment', { box_id: box.id, status: 'ASSIGNED' });
  const task_ids = task_assignments.map((ta) => ta.task_id);

  // Get all tasks
  const tasks = await BasicModel.getRecords('task', {}, [['id', task_ids]]);

  // For each task, get all microtasks
  await BBPromise.mapSeries(tasks, async (task) => {
    const granularity = task.assignment_granularity;
    const limit = granularity == 'GROUP' ? 10 : 1000;

    type MicrotasksResponse = {
      groups: MicrotaskGroupRecord[];
      microtasks: MicrotaskRecord[];
      karya_files: KaryaFileRecord[];
    };

    let responseLength = limit;

    while (responseLength >= limit) {
      let microtasksData: MicrotasksResponse;
      const latest_update_response =
        granularity == 'GROUP'
          ? await knex<MicrotaskGroupRecord>('microtask_group').where('task_id', task.id).max('last_updated_at')
          : await knex<MicrotaskRecord>('microtask').where('task_id', task.id).max('last_updated_at');

      const latest_update = latest_update_response[0].max || new Date(0).toISOString();

      // Send request to get microtasks
      try {
        const response = await axiosLocal.get<MicrotasksResponse>(`/task/${task.id}/microtasks`, {
          params: { from: latest_update, limit },
        });
        microtasksData = response.data;
      } catch (e) {
        cronLogger.error('Failed to get microtasks');
        return;
      }

      // Upsert records
      const { groups, microtasks, karya_files } = microtasksData;
      try {
        await BBPromise.mapSeries(groups, async (group) => {
          await BasicModel.upsertRecord('microtask_group', group);
        });
        await BBPromise.mapSeries(microtasks, async (microtask) => {
          await BasicModel.upsertRecord('microtask', microtask);
        });
        await BBPromise.mapSeries(karya_files, async (karya_file) => {
          await BasicModel.upsertRecord('karya_file', karya_file);
        });
      } catch (e) {
        cronLogger.error('Failed to update local microtasks');
        return;
      }

      responseLength = granularity == 'GROUP' ? groups.length : microtasks.length;
    }
  });
}

/**
 * Get SAS tokens for pending karya files: url = null;
 */
export async function getNewSASTokens(axiosLocal: AxiosInstance) {
  try {
    // Extract all pending karya files. Those in the server but not in the box
    const pendingFiles = await BasicModel.getRecords('karya_file', {
      in_server: true,
      in_box: false,
      url: null,
    });

    if (pendingFiles.length > 0) {
      cronLogger.info(`Getting SAS tokens for ${pendingFiles.length} files`);
    }

    const failedFiles: string[] = [];
    await BBPromise.mapSeries(pendingFiles, async (file) => {
      try {
        const response = await axiosLocal.get<KaryaFileRecord>(`/karya_file/${file.id}`);
        await BasicModel.updateSingle('karya_file', { id: file.id }, { url: response.data.url });
      } catch (e) {
        failedFiles.push(file.id);
      }
    });
    // TODO: Handle failed files.length > 0
  } catch (e) {
    cronLogger.error('Unknown error while getting SAS token');
  }
}

/**
 * Download pending karya files
 */
export async function downloadPendingKaryaFiles() {
  try {
    // Local folder
    const localFolder = envGetString('LOCAL_FOLDER');
    const localFolderPath = `${process.cwd()}/${localFolder}`;

    const pendingFiles = await BasicModel.getRecords('karya_file', { in_server: true, in_box: false });

    if (pendingFiles.length > 0) {
      cronLogger.info(`Downloading ${pendingFiles.length} files`);
    }

    const failedFiles: string[] = [];
    await BBPromise.mapSeries(pendingFiles, async (file) => {
      if (file.url == null) return;
      const filepath = `${localFolderPath}/${file.container_name}/${file.name}`;

      // Ignore download if the file already exist and checksum is correct
      try {
        await fs.promises.access(filepath);
        const checksum = await getChecksum(filepath, file.algorithm);
        if (checksum == file.checksum) {
          // Update db
          await BasicModel.updateSingle('karya_file', { id: file.id }, { in_box: true, url: null });
          return;
        }
        // Incorrect checksum; Proceed further
      } catch (e) {
        // File not present; Proceed further
      }

      try {
        // Download file
        await downloadKaryaFile(file.url, filepath);
        // Check checksum
        const checksum = await getChecksum(filepath, file.algorithm);
        if (checksum != file.checksum) {
          throw new Error('Checksum error');
        }
        // Update db
        await BasicModel.updateSingle('karya_file', { id: file.id }, { in_box: true, url: null });
      } catch (e) {
        failedFiles.push(file.id);
        await BasicModel.updateSingle('karya_file', { id: file.id }, { url: null });
      }
    });
  } catch (e) {
    cronLogger.error('Unknown error while downloading karya files');
  }
}

/**
 * Download a Karya File using the URL into the target path.
 * @param url Blob URL of the karya file
 * @param filepath Local target path for downloaded file
 */
async function downloadKaryaFile(url: string, filepath: string) {
  const writer = fs.createWriteStream(filepath);
  const response = await axios.get(url, { responseType: 'stream' });
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

/**
 * Get verified assignments for all tasks
 */
export async function getVerifiedAssignments(box: BoxRecord, axiosLocal: AxiosInstance) {
  cronLogger.info(`Getting verified assignments for tasks`);
  // Get incomplete task assignments
  const task_assignments = await BasicModel.getRecords('task_assignment', { box_id: box.id });
  const task_ids = task_assignments.map((ta) => ta.task_id);

  // Get all tasks
  const tasks = await BasicModel.getRecords('task', {}, [['id', task_ids]]);

  // For each task, get all microtasks
  await BBPromise.mapSeries(tasks, async (task) => {
    const limit = 1000;

    let responseLength = limit;

    while (responseLength >= limit) {
      let verifiedAssignments: MicrotaskAssignmentRecord[];
      let latest_verified = new Date(0).toISOString();
      try {
        const latest_verified_response = await knex<MicrotaskAssignmentRecord>('microtask_assignment')
          .where('task_id', task.id)
          .max('verified_at');
        latest_verified = latest_verified_response[0].max || new Date(0).toISOString();
      } catch (e) {
        cronLogger.error('Failed to get response from db for latest verified');
        cronLogger.error(JSON.stringify(e));
        return;
      }

      // Send request to get microtasks
      try {
        const response = await axiosLocal.get<MicrotaskAssignmentRecord[]>(`/task/${task.id}/verified_assignments`, {
          params: { from: latest_verified, limit },
        });
        verifiedAssignments = response.data;
      } catch (e) {
        cronLogger.error('Failed to get verified assignemts');
        return;
      }

      // Upsert records
      try {
        await BBPromise.mapSeries(verifiedAssignments, async (assignment) => {
          await BasicModel.upsertRecord('microtask_assignment', assignment);
        });
      } catch (e) {
        cronLogger.error('Failed to update local assignments');
        return;
      }

      responseLength = verifiedAssignments.length;
    }
  });
}

/**
 * Get all account record updates from the server
 */
export async function getAccountRecords(axiosLocal: AxiosInstance) {
  cronLogger.info(`Getting updated account records`);
  // Get latest receive time on transaction records
  const response = await knex<PaymentsTransactionRecord>('payments_transaction').max('last_updated_at');
  const latest_update_time = response[0].max || new Date(0).toISOString();

  let accountRecords: PaymentsAccountRecord[];

  try {
    const response = await axiosLocal.get<PaymentsAccountRecord[]>(`/payments/accounts/updates`, {
      params: { from: latest_update_time },
    });
    accountRecords = response.data;
  } catch (e) {
    cronLogger.error('Failed to get update for account records');
  }

  try {
    await BBPromise.mapSeries(accountRecords!, async (accountRecord) => {
      await BasicModel.upsertRecord('payments_account', accountRecord);
    });
  } catch (e) {
    cronLogger.error('Failed to upsert the account records');
  }
}

/**
 * Get all transaction record updates from the server
 */
export async function getTransactionRecords(axiosLocal: AxiosInstance) {
  cronLogger.info(`Getting updated transaction records`);
  // Get latest receive time on transaction records
  const response = await knex<PaymentsTransactionRecord>('payments_transaction').max('last_updated_at');
  const latest_update_time = response[0].max || new Date(0).toISOString();

  let transactionRecords: PaymentsTransactionRecord[];

  try {
    const response = await axiosLocal.get<PaymentsTransactionRecord[]>(`/payments/transactions/updates`, {
      params: { from: latest_update_time },
    });
    transactionRecords = response.data;
  } catch (e) {
    cronLogger.error('Failed to get update for transaction records');
  }

  try {
    await BBPromise.mapSeries(transactionRecords!, async (transactionRecord) => {
      await BasicModel.upsertRecord('payments_transaction', transactionRecord);
    });
  } catch (e) {
    cronLogger.error('Failed to upsert the account records');
  }
}
