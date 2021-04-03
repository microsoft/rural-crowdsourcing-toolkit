// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Handler for task approval. Generates all microtask groups and microtasks
 * associated with the task.
 */

import { Promise as BBPromise } from 'bluebird';
import * as tar from 'tar';

import * as BasicModel from '../models/BasicModel';
import { upsertKaryaFile } from '../models/KaryaFileModel';
import { taskLogger } from '../utils/Logger';

import { scenarioMap } from '../scenarios/Index';

import { TaskRecord } from '../db/TableInterfaces.auto';
import { BlobParameters, getBlobName } from '@karya/blobstore';

/**
 * Handler to approve a given task. Task approval involves the following
 * activities.
 *
 * 1) Receive all microtask groups and microtasks for the task
 * 2) Create microtask group records for each mircrotask group
 * 3) For each microtask, a) create file record if there is an input file, b)
 *    create the microtask record
 *
 *
 * @param taskRecord Task record to be approved
 */
export async function approveTask(taskRecord: TaskRecord) {
  taskLogger.info(`Request to approve task '${taskRecord.id}'`);

  // Delete all microtasks and microtask groups associated with this task.
  // This is necessary if the approval failed for some reason (crash?).
  // And there is a retry
  await BasicModel.removeRecords('microtask', { task_id: taskRecord.id });
  await BasicModel.removeRecords('microtask_group', { task_id: taskRecord.id });

  // Get the scenario object
  const scenarioRecord = await BasicModel.getSingle('scenario', {
    id: taskRecord.scenario_id,
  });
  const scenario = scenarioMap[scenarioRecord.name];

  // Extract microtasks for the task
  const mtgResponse = await scenario.generateMicrotasks(taskRecord);

  if (mtgResponse.success === false) {
    throw new Error(mtgResponse.message);
  }

  // Extract the microtask groups
  const { microtaskGroups, task_folder } = mtgResponse;

  // Task tar files
  const taskTarFiles: string[] = [];

  // Perform necessary activity for each microtask group
  await BBPromise.mapSeries(microtaskGroups, async (microtaskGroup) => {
    // extract info
    const { mg_info, microtasks } = microtaskGroup;

    // if group is not null, insert group record
    const groupRecord =
      mg_info && (await BasicModel.insertRecord('microtask_group', mg_info));
    const group_id = groupRecord && groupRecord.id;

    // insert all microtasks
    await BBPromise.mapSeries(microtasks, async (microtask) => {
      // extract info
      const { m_info, files } = microtask;

      // Create the microtask record
      const microtaskRecord = await BasicModel.insertRecord('microtask', {
        ...m_info,
        group_id,
      });

      // if the microtask has files associated with it, then handle those files
      if (files !== undefined) {
        const blobParams: BlobParameters = {
          cname: 'microtask-input',
          microtask_id: microtaskRecord.id,
          ext: 'tar',
        };

        // Create a tar ball
        const tarFileName = getBlobName(blobParams);
        const folder = task_folder as string;
        const tarFilePath = `${folder}/${tarFileName}`;
        await tar.c({ file: tarFilePath, C: folder }, files);

        // Extract MD5, upload file to blob store, insert file record
        const kfRecord = await upsertKaryaFile(tarFilePath, 'md5', blobParams);

        // Add the tar file to the task tar files
        taskTarFiles.push(tarFileName);

        // Update the file link for the microtask Record
        await BasicModel.updateSingle(
          'microtask',
          { id: microtaskRecord.id },
          { input_file_id: kfRecord.id },
        );
      }
    });
  });

  // If there are tar files for the task, create the task super tar file
  if (taskTarFiles.length > 0) {
    const taskBlobParams: BlobParameters = {
      cname: 'task-input',
      task_id: taskRecord.id,
      ext: 'tar',
    };

    // Create a tar of tars
    const taskTarFileName = getBlobName(taskBlobParams);
    const folder = task_folder as string;
    const taskTarFilePath = `${folder}/${taskTarFileName}`;
    await tar.c({ file: taskTarFilePath, C: folder }, taskTarFiles);

    // Insert tar into karya file table
    const tkfRecord = await upsertKaryaFile(
      taskTarFilePath,
      'md5',
      taskBlobParams,
    );

    // Update the file link in task record
    await BasicModel.updateSingle(
      'task',
      { id: taskRecord.id },
      { input_file_id: tkfRecord.id },
    );
  }
}
