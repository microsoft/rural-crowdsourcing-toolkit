// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Entry file for the scenarios

import { Task, TaskRecord } from '@karya/db';
import { MicrotaskList, ScenarioInterface } from './ScenarioInterface';
import { SpeechDataScenario } from './scenarios/SpeechData';
import { promises as fsp } from 'fs';

export * from './ScenarioInterface';

export type ScenarioName = 'speech-data';

export const scenarioMap: { [key in ScenarioName]: ScenarioInterface } = {
  'speech-data': SpeechDataScenario,
};

/**
 * Check if the parameters of a newly created task are valid.
 * @param task Task to be validated
 * @returns Parsed parameters if the valid
 */
export async function validateTaskParameters(task: Task): Promise<object> {
  // Extract the scenario corresponding to the task
  const scenario_name = task.scenario_name as ScenarioName;
  const scenario = scenarioMap[scenario_name];

  // Check if the task params are valid
  const { value, error } = scenario.task_input.validate(task.params);
  if (error) throw error;
  return value;
}

/**
 * Process new input files for a validated task
 * @param task Task for which input has to be processed
 * @param jsonFilePath JSON file associated with the input
 * @param tarFilePath Tar file associated with the input
 * @param localFolder Local parent folder for task files
 */
export async function processInputFile(
  task: TaskRecord,
  jsonFilePath?: string,
  tarFilePath?: string,
  localFolder?: string
): Promise<MicrotaskList> {
  // Extract the scenario corresponding to the task
  const scenario_name = task.scenario_name as ScenarioName;
  const scenario = scenarioMap[scenario_name];

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

  // Check if tar input is provided
  if (scenario.task_input_file.tar.required && !tarFilePath) {
    throw new Error('Task requires tar file input');
  }

  // Create the task folder
  const task_folder = `${localFolder}/${task.id}`;
  try {
    await fsp.mkdir(task_folder);
  } catch (e) {
    // Folder already exists?
  }

  // Process input files for the scenario
  const microtaskList = await scenario.processInputFile(task, taskJsonInput, tarFilePath, task_folder);
  return microtaskList;
}

/**
 * Generated output for a task.
 * @param task Task record for which output has to be generated
 * @param localFolder Temporary local folder
 */
export async function generateOutput(task: TaskRecord, localFolder: string) {}
