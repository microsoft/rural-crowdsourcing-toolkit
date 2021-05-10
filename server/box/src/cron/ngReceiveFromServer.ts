// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Receive files and information from the server

import { BasicModel, knex } from '@karya/common';
import {
  BoxRecord,
  KaryaFileRecord,
  MicrotaskGroupRecord,
  MicrotaskRecord,
  TaskAssignmentRecord,
  TaskRecord,
} from '@karya/core';
import { Promise as BBPromise } from 'bluebird';
import { AxiosInstance } from 'axios';
import { cronLogger } from '../utils/Logger';

/**
 *
 * @param box Box record
 * @param axios Axios instance with defaults
 */
export async function getTaskAssignments(box: BoxRecord, axios: AxiosInstance) {
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
    const response = await axios.get<TaskAssignmentResponse>('/task_assignments', {
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
export async function getMicrotasks(box: BoxRecord, axios: AxiosInstance) {
  // Get incomplete task assignments
  const task_assignments = await BasicModel.ngGetRecords('task_assignment', { box_id: box.id, status: 'assigned' });
  const task_ids = task_assignments.map((ta) => ta.task_id);

  // Get all tasks
  const tasks = await BasicModel.ngGetRecords('task', {}, [['id', task_ids]]);

  // For each task, get all microtasks
  await BBPromise.mapSeries(tasks, async (task) => {
    const granularity = task.assignment_granularity;
    const limit = granularity == 'group' ? 10 : 5;

    type MicrotasksResponse = {
      groups: MicrotaskGroupRecord[];
      microtasks: MicrotaskRecord[];
      karya_files: KaryaFileRecord[];
    };

    let responseLength = limit;

    while (responseLength >= limit) {
      let microtasksData: MicrotasksResponse;
      const latest_update_response =
        granularity == 'group'
          ? await knex<MicrotaskGroupRecord>('microtask_group').where('task_id', task.id).max('last_updated_at')
          : await knex<MicrotaskRecord>('microtask').where('task_id', task.id).max('last_updated_at');

      const latest_update = latest_update_response[0].max || new Date(0).toISOString();

      // Send request to get microtasks
      try {
        const response = await axios.get<MicrotasksResponse>(`/task/${task.id}/microtasks`, {
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

      responseLength = granularity == 'group' ? groups.length : microtasks.length;
    }
  });
}
