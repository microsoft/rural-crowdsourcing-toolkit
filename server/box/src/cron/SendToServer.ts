// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Send files and information to the server

import { BasicModel, knex } from '@karya/common';
import { BoxRecord, KaryaFileRecord, MicrotaskAssignmentRecord, WorkerRecord } from '@karya/core';
import { envGetString } from '@karya/misc-utils';
import { Promise as BBPromise } from 'bluebird';
import FormData from 'form-data';
import { promises as fsp } from 'fs';
import { AxiosInstance } from 'axios';
import { cronLogger } from '../utils/Logger';

/**
 * Upload all karya files to the server
 * @param box Box record
 * @param axios Axios instance with defaults
 */
export async function uploadKaryaFilesToServer(box: BoxRecord, axiosLocal: AxiosInstance) {
  // Get all files that are yet to be uploaded to the server
  const files = await BasicModel.getRecords('karya_file', { box_id: box.id, in_box: true, in_server: false });

  // Local folder
  const localFolder = envGetString('LOCAL_FOLDER');
  const localFolderPath = `${process.cwd()}/${localFolder}`;

  // Failed list
  const fileNotFound: string[] = [];
  const failedUpload: string[] = [];

  cronLogger.info(`Need to upload ${files.length} files`);

  // Upload files
  await BBPromise.mapSeries(files, async (file) => {
    const path = `${localFolderPath}/${file.container_name}/${file.name}`;

    // Read the file
    let data: Buffer;
    try {
      data = await fsp.readFile(path);
    } catch (e) {
      // file not found
      fileNotFound.push(file.id);
      return;
    }

    // Create form data request
    const form = new FormData();
    form.append('data', JSON.stringify(file));
    form.append('file', data, { filename: file.name });

    // Upload file
    try {
      await axiosLocal.put<KaryaFileRecord>('/karya_file', form, { headers: form.getHeaders() });
      await BasicModel.updateSingle('karya_file', { id: file.id }, { in_server: true });
    } catch (e) {
      failedUpload.push(file.id);
    }
  });

  const failedCount = fileNotFound.length + failedUpload.length;
  if (failedCount > 0) {
    cronLogger.warn(`Failed to upload ${failedCount} files`);
  } else {
    cronLogger.info('Uploaded all files successfully');
  }
}

/**
 * Send all newly created workers to the server
 * TODO: Limit the number of records sent and loop?
 * @param box Box with the workers
 * @param axiosLocal Local axios instance with defaults
 */
export async function sendNewWorkers(box: BoxRecord, axiosLocal: AxiosInstance) {
  // Get all new workers created that have not been sent to the server yet
  try {
    const workers = await knex<WorkerRecord>('worker')
      .where('box_id', box.id)
      .whereRaw('sent_to_server_at < created_at');

    // If no new workers return
    if (workers.length == 0) return;

    cronLogger.info(`Sending '${workers.length}' new workers to server`);

    type NewWorkerResponse = Pick<WorkerRecord, 'id' | 'sent_to_server_at'>[];

    const response = await axiosLocal.put<NewWorkerResponse>('/new_workers', workers);
    const workerResponse = response.data;

    await BBPromise.mapSeries(workerResponse, async (worker) => {
      await BasicModel.updateSingle('worker', { id: worker.id }, { sent_to_server_at: worker.sent_to_server_at });
    });
  } catch (e) {
    cronLogger.error('Failed to send new workers to server');
  }
}

/**
 * Send all workers whose profile has been updated to the server
 * TODO: Limit the number of records sent and loop?
 * @param box Box with the workers
 * @param axiosLocal Local axios instance with defaults
 */
export async function sendUpdatedWorkers(box: BoxRecord, axiosLocal: AxiosInstance) {
  // Get all new workers created that have not been sent to the server yet
  try {
    const workers = await knex<WorkerRecord>('worker')
      .where('box_id', box.id)
      .whereRaw('sent_to_server_at < profile_updated_at');

    // If no new workers return
    if (workers.length == 0) return;

    cronLogger.info(`Sending '${workers.length}' updated workers to server`);

    type NewWorkerResponse = Pick<WorkerRecord, 'id' | 'sent_to_server_at'>[];

    const response = await axiosLocal.put<NewWorkerResponse>('/workers', workers);
    const workerResponse = response.data;

    await BBPromise.mapSeries(workerResponse, async (worker) => {
      await BasicModel.updateSingle('worker', { id: worker.id }, { sent_to_server_at: worker.sent_to_server_at });
    });
  } catch (e) {
    cronLogger.error('Failed to send updated workers to server');
  }
}

/**
 * Send newly created microtask assignments to the server
 */
export async function sendNewAssignments(box: BoxRecord, axiosLocal: AxiosInstance) {
  try {
    // Get all task assignments for the box
    const task_assignments = await BasicModel.getRecords('task_assignment', { box_id: box.id });
    const task_ids = task_assignments.map((ta) => ta.task_id);
    const tasks = await BasicModel.getRecords('task', {}, [['id', task_ids]]);

    type SendNewAssignmentsResponse = Pick<MicrotaskAssignmentRecord, 'id' | 'sent_to_server_at'>[];

    const batch_size = 1000;
    // For each task send all newly created assignments in batches
    await BBPromise.mapSeries(tasks, async (task) => {
      const assignments = await knex<MicrotaskAssignmentRecord>('microtask_assignment')
        .where({
          box_id: box.id,
          task_id: task.id,
          status: 'ASSIGNED',
        })
        .whereRaw('sent_to_server_at < created_at');

      let batch_id = 0;
      let batch: MicrotaskAssignmentRecord[];
      do {
        batch = assignments.slice(batch_id * batch_size, (batch_id + 1) * batch_size);
        const response = await axiosLocal.put<SendNewAssignmentsResponse>(`/task/${task.id}/new_assignments`, batch);
        const updates = response.data;
        await BBPromise.mapSeries(updates, async ({ id, sent_to_server_at }) => {
          await BasicModel.updateSingle('microtask_assignment', { id }, { sent_to_server_at });
        });
      } while (batch.length >= batch_size);
    });
  } catch (e) {
    cronLogger.error('Unknown error while sending assignments');
  }
}

/**
 * Send completed microtask assignments to the server
 */
export async function sendCompletedAssignments(box: BoxRecord, axiosLocal: AxiosInstance) {
  try {
    // Get all task assignments for the box
    const task_assignments = await BasicModel.getRecords('task_assignment', { box_id: box.id });
    const task_ids = task_assignments.map((ta) => ta.task_id);
    const tasks = await BasicModel.getRecords('task', {}, [['id', task_ids]]);

    type SendNewAssignmentsResponse = Pick<MicrotaskAssignmentRecord, 'id' | 'submitted_to_server_at'>[];

    const batch_size = 1000;
    // For each task send all newly created assignments in batches
    await BBPromise.mapSeries(tasks, async (task) => {
      const assignments = await knex<MicrotaskAssignmentRecord>('microtask_assignment')
        .where({
          box_id: box.id,
          task_id: task.id,
          status: 'COMPLETED',
        })
        .whereRaw('submitted_to_server_at < completed_at');

      let batch_id = 0;
      let batch: MicrotaskAssignmentRecord[];
      do {
        batch = assignments.slice(batch_id * batch_size, (batch_id + 1) * batch_size);
        const response = await axiosLocal.put<SendNewAssignmentsResponse>(
          `/task/${task.id}/completed_assignments`,
          batch
        );
        const updates = response.data;
        await BBPromise.mapSeries(updates, async ({ id, submitted_to_server_at }) => {
          await BasicModel.updateSingle('microtask_assignment', { id }, { submitted_to_server_at });
        });
      } while (batch.length >= batch_size);
    });
  } catch (e) {
    cronLogger.error('Unknown error while sending assignments');
  }
}
