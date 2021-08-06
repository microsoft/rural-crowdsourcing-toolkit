// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Task output generator op

import {
  AssignmentRecordType,
  BlobParameters,
  getBlobName,
  MicrotaskRecordType,
  TaskOpRecord,
  TaskRecordType,
} from '@karya/core';
import { BasicModel, downloadBlob, TaskOpModel } from '@karya/common';
import { envGetString } from '@karya/misc-utils';
import { backendScenarioMap } from '../../scenarios/Index';
import { promises as fsp } from 'fs';
import tar from 'tar';
import { upsertKaryaFile } from '../../models/KaryaFileModel';
import { Promise as BBPromise } from 'bluebird';

// Task output generator job object
export type TaskOutputGeneratorObject = {
  taskOp: TaskOpRecord;
  task: TaskRecordType;
};

/**
 * Generate output for a task. Get all the verified assignments and completed
 * microtasks in the duration between this op and the previous execution of the
 * generate output op. Invoke the scenario specific output generator.
 * @param ogObject Task output generator objects
 */
export async function generateTaskOutput(ogObject: TaskOutputGeneratorObject) {
  const { task, taskOp } = ogObject;

  // Get the previous op time
  const previousOpTime = await TaskOpModel.previousOpTime(taskOp);
  const currentOpTime = taskOp.created_at;

  // Get all verified assignments between the two task ops
  const assignments = (await BasicModel.getRecords(
    'microtask_assignment',
    { task_id: task.id, status: 'VERIFIED' },
    [],
    [['verified_at', previousOpTime, currentOpTime]]
  )) as AssignmentRecordType[];

  // Get all completed microtasks between the two ops
  const microtasks = (await BasicModel.getRecords(
    'microtask',
    { task_id: task.id, status: 'COMPLETED' },
    [],
    [['last_updated_at', previousOpTime, currentOpTime]]
  )) as MicrotaskRecordType[];

  // If no verified assignments or completed microtasks, return
  if (assignments.length == 0 && microtasks.length == 0) return;

  // Get the task output folder
  const localFolder = envGetString('LOCAL_FOLDER');
  const taskOutputBlobParameters: BlobParameters = {
    cname: 'task-output',
    task_id: task.id,
    timestamp: currentOpTime.replace(/:/g, '.'),
    ext: 'tgz',
  };
  const taskOutputName = getBlobName(taskOutputBlobParameters);
  const task_folder = `${process.cwd()}/${localFolder}/task-output/${task.id}/${currentOpTime}`;
  await fsp.mkdir(task_folder, { recursive: true });

  // Download any assignment output files and extract them
  await BBPromise.mapSeries(assignments, async (assignment) => {
    if (assignment.output_file_id) {
      const kf = await BasicModel.getSingle('karya_file', { id: assignment.output_file_id });
      const tgzPath = `${task_folder}/${kf.name}`;
      await downloadBlob(kf.url!, tgzPath);
      await tar.x({ C: task_folder, file: tgzPath });
    }
  });

  // Call the output generator for the scenario
  const scenarioObj = backendScenarioMap[task.scenario_name];
  // @ts-ignore <weird type error for assignments>
  const files = await scenarioObj.generateOutput(task, assignments, microtasks, task_folder, currentOpTime);

  // If no files, return
  if (files.length == 0) return;

  // Tar all the files in the task output
  const outputTgzPath = `${task_folder}/${taskOutputName}`;
  await tar.c({ C: task_folder, gzip: true, file: outputTgzPath }, files);
  const fileRecord = await upsertKaryaFile(outputTgzPath, 'MD5', taskOutputBlobParameters);

  // Update the task op file record
  await BasicModel.updateSingle('task_op', { id: taskOp.id }, { file_id: fileRecord.id });
}
