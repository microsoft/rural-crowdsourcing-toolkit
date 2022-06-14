// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Task input processor op

import { BlobParameters, getBlobName, TaskOpRecord, TaskRecordType } from '@karya/core';
import { promises as fsp } from 'fs';
import { Promise as BBPromise } from 'bluebird';
import { BasicModel } from '@karya/common';
import tar from 'tar';
import { upsertKaryaFile } from '../../models/KaryaFileModel';
import { backendScenarioMap } from '../../scenarios/Index';

// Task input processor object
export type TaskInputProcessorObject = {
  task: TaskRecordType;
  jsonFilePath: string | undefined;
  tgzFilePath: string | undefined;
  folderPath: string;
  taskOp: TaskOpRecord;
};

/**
 * Process new input files for a validated task
 * @param task Task for which input has to be processed
 * @param jsonFilePath JSON file associated with the input
 * @param tgzFilePath Tar file associated with the input
 * @param localFolder Local parent folder for task files
 */
export async function processInputFile(
  task: TaskRecordType,
  jsonFilePath: string | undefined,
  tgzFilePath: string | undefined,
  taskFolder: string
) {
  // Extract the scenario corresponding to the task
  const scenario_name = task.scenario_name;
  const scenario = backendScenarioMap[scenario_name];

  let taskJsonInput: any;

  // Check if JSON input is provided
  if (scenario.task_input_file.json.required) {
    if (!jsonFilePath) {
      throw new Error('Task requires a JSON input');
    }

    try {
      // Read and parse the json file
      const jsonFileData = await fsp.readFile(jsonFilePath);
      const jsonData = JSON.parse(jsonFileData.toString());

      // check if the JSON file matches the required schema
      const { value, error } = scenario.task_input_file.json.schema.validate(jsonData);
      if (error) throw error;

      taskJsonInput = value;
    } catch (e) {
      throw new Error('Error while parsing the JSON file');
    }
  }

  // Check if tgz input is provided
  if (scenario.task_input_file.tgz.required) {
    if (!tgzFilePath) {
      throw new Error('Task requires tgz file input');
    }
    await tar.x({ file: tgzFilePath, C: taskFolder });
  }

  // Process input files for the scenario
  const groups = await scenario.processInputFile(task, taskJsonInput, tgzFilePath, taskFolder);

  // Create microtask groups and microtasks
  // @ts-ignore -- Not sure what this error is
  await BBPromise.mapSeries(groups, async (group) => {
    // extract group info and create microtask group if necessary
    const { mg, microtasks } = group;
    const groupRecord = mg && (await BasicModel.insertRecord('microtask_group', mg));
    const group_id = groupRecord && groupRecord.id;

    // extract microtasks and create them
    await BBPromise.mapSeries(microtasks, async (microtask) => {
      const mtRecord = await BasicModel.insertRecord('microtask', {
        ...microtask,
        base_credits: task.params.baseCreditsPerMicrotask,
        deadline: task.params.deadline,
        group_id,
      });

      // create and upload microtask input files if necessary
      if (mtRecord.input.files) {
        const fileList = Object.values(mtRecord.input.files);
        const inputBlobParams: BlobParameters = {
          cname: 'microtask-input',
          microtask_id: mtRecord.id,
          ext: 'tgz',
        };
        const inputTgzFileName = getBlobName(inputBlobParams);
        const inputTgzFilePath = `${taskFolder}/${inputTgzFileName}`;

        // Create the tar ball
        await tar.c({ C: taskFolder, file: inputTgzFilePath, gzip: true }, fileList);
        const fileRecord = await upsertKaryaFile(inputTgzFilePath, 'MD5', inputBlobParams);

        // Update the microtask record
        await BasicModel.updateSingle('microtask', { id: mtRecord.id }, { input_file_id: fileRecord.id });
      }
    });
  });

  // Clean up the input files
  try {
    await fsp.rmdir(taskFolder, { recursive: true });
  } catch (e) {
    // Something went wrong while cleaning up
    // Ignore
  }
}
