// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Entry point for backend scenario functionality. Manages creation and
// execution of task operations: processing input files, and generating output
// files.

import { ScenarioName, TaskOpRecord, TaskRecord } from '@karya/core';
import { BackendScenarioInterface } from './ScenarioInterface';
import Bull from 'bull';
import { backendSpeechDataScenario } from './scenarios/SpeechData';
import { promises as fsp } from 'fs';
import { Promise as BBPromise } from 'bluebird';
import { BasicModel } from '@karya/common';

// Local scenario Map
const backendScenarioMap: { [key in ScenarioName]: BackendScenarioInterface } = {
  'speech-data': backendSpeechDataScenario,
};

// Task input processor queue

export type TaskInputProcessorObject = {
  task: TaskRecord;
  jsonFilePath: string | undefined;
  tgzFilePath: string | undefined;
  folderPath: string;
  taskOp: TaskOpRecord;
};

export const inputProcessorQueue = new Bull<TaskInputProcessorObject>('process_input');

// Set handler for input processor job
inputProcessorQueue.process(async (job) => {
  const { task, jsonFilePath, tgzFilePath, folderPath } = job.data;
  await processInputFile(task, jsonFilePath, tgzFilePath, folderPath);
});

// Handler for job starting
inputProcessorQueue.on('active', async (job) => {
  const taskOp = job.data.taskOp;
  const started_at = new Date().toISOString();
  await BasicModel.updateSingle('task_op', { id: taskOp.id }, { status: 'RUNNING', started_at });
});

// Handler for successful completion of  input processor job
inputProcessorQueue.on('completed', async (job) => {
  const taskOp = job.data.taskOp;
  const completed_at = new Date().toISOString();
  await BasicModel.updateSingle('task_op', { id: taskOp.id }, { status: 'COMPLETED', completed_at });
});

// Handler for failure of input processor job
inputProcessorQueue.on('failed', async (job, err) => {
  const taskOp = job.data.taskOp;
  const messages = [err.message || 'Input processing failed'];
  await BasicModel.updateSingle('task_op', { id: taskOp.id }, { status: 'FAILED', messages: { messages } });
});

/**
 * Process new input files for a validated task
 * @param task Task for which input has to be processed
 * @param jsonFilePath JSON file associated with the input
 * @param tgzFilePath Tar file associated with the input
 * @param localFolder Local parent folder for task files
 */
async function processInputFile(task: TaskRecord, jsonFilePath?: string, tgzFilePath?: string, taskFolder?: string) {
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
    // TODO: Extract tgz files?
  }

  // Process input files for the scenario
  const groups = await scenario.processInputFile(task, taskJsonInput, tgzFilePath, taskFolder);

  // Create microtask groups and microtasks
  await BBPromise.mapSeries(groups, async (group) => {
    // extract group info and create microtask group if necessary
    const { mg, microtasks } = group;
    const groupRecord = mg && (await BasicModel.insertRecord('microtask_group', mg));
    const group_id = groupRecord && groupRecord.id;

    // extract microtasks and create them
    await BBPromise.mapSeries(microtasks, async (microtask) => {
      await BasicModel.insertRecord('microtask', { ...microtask, group_id });

      // TODO: create and upload microtask input files if necessary
      // TODO: Microtask object should always carry an input
      if (microtask.input?.files) {
      }
    });
  });
}
