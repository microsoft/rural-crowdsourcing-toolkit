// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Handler for task related routes

import { UserRouteMiddleware, UserRouteState } from '../routes/UserRoutes';
import * as HttpResponse from '@karya/http-response';
import {
  Task,
  scenarioMap,
  getBlobName,
  BlobParameters,
  TaskRecordType,
  policyMap,
  coreScenarioParameters,
} from '@karya/core';
import { joiSchema } from '@karya/parameter-specs';
import { BasicModel, MicrotaskModel, TaskModel, TaskOpModel, WorkerModel, getBlobSASURL } from '@karya/common';
import { envGetString } from '@karya/misc-utils';
import { promises as fsp } from 'fs';
import * as tar from 'tar';
import { upsertKaryaFile } from '../models/KaryaFileModel';
import { inputProcessorQ, outputGeneratorQ } from '../task-ops/Index';
import { csvToJson } from '../scenarios/Common';
import { Promise as BBPromise } from 'bluebird';
// import * as TokenAuthHandler from '../utils/auth/tokenAuthoriser/tokenAuthHandler/TokenAuthHandler';

// Task route state for routes dealing with a specific task
type TaskState = { task: TaskRecordType };
type TaskRouteMiddleware = UserRouteMiddleware<TaskState>;
export type TaskRouteState = UserRouteState<TaskState>;

/**
 * Create a new task.
 */
export const create: UserRouteMiddleware = async (ctx) => {
  try {
    const user = ctx.state.entity;
    const task: Task = ctx.request.body;

    // Set the work provider id
    task.work_provider_id = user.id;

    // TODO: Validate the task object

    // Validate the task parameters
    const scenario = scenarioMap[task.scenario_name!];
    const policy = policyMap[task.policy!];

    const schema = joiSchema(scenario.task_input.concat(policy.params).concat(coreScenarioParameters));
    const { value: params, error: paramsError } = schema.validate(task.params);

    if (paramsError) {
      HttpResponse.BadRequest(ctx, 'Invalid task parameters');
      return;
    }

    // check if there is a deadline that is provided
    const taskDeadline = params.deadline;
    if (taskDeadline) {
      params.deadline = taskDeadline == '' ? null : new Date(taskDeadline).toISOString();
    }

    // update params
    task.params = params;

    // update other fields
    task.status = 'SUBMITTED';

    try {
      const insertedRecord = await BasicModel.insertRecord('task', task);
      // await TokenAuthHandler.grantTaskPermission(user, insertedRecord.id, ['read', 'edit']);
      HttpResponse.OK(ctx, insertedRecord);
    } catch (e) {
      // Internal server error
      HttpResponse.BadRequest(ctx, 'Unknown error occured');
    }
  } catch (e) {
    HttpResponse.BadRequest(ctx, 'Unknown error occured');
  }
};

/**
 * Get all tasks.
 */
export const getAll: UserRouteMiddleware = async (ctx) => {
  try {
    const user = ctx.state.entity;
    const filter: Task = user.role == 'WORK_PROVIDER' ? { work_provider_id: ctx.state.entity.id } : {};
    const records = await BasicModel.getRecords('task', filter);
    HttpResponse.OK(ctx, records);
  } catch (e) {
    // TODO: convert this into an internal server error
    HttpResponse.BadRequest(ctx, 'Unknown error occured');
  }
};

/**
 * Middleware to check if a task exists and if the current user has access to
 * that task.
 */
export const checkTask: TaskRouteMiddleware = async (ctx, next) => {
  const task_id = ctx.params.id;

  // Check if the task exists
  try {
    ctx.state.task = (await BasicModel.getSingle('task', { id: task_id })) as TaskRecordType;
  } catch (e) {
    HttpResponse.NotFound(ctx, 'Requested task not found');
    return;
  }

  // Check if the user has access to the task. Allow admins to pass through.
  if (ctx.state.entity.role != 'ADMIN' && ctx.state.task.work_provider_id != ctx.state.entity.id) {
    HttpResponse.Forbidden(ctx, 'User does not have access to the task');
    return;
  }

  await next();
};

/**
 * Submit input files for a task
 */
export const submitInputFiles: TaskRouteMiddleware = async (ctx) => {
  const task = ctx.state.task as TaskRecordType;
  const { files } = ctx.request;

  // Task needs to have input files
  if (!files) {
    HttpResponse.BadRequest(ctx, 'No input file submitted');
    return;
  }

  // Get the scenario
  const scenario = scenarioMap[task.scenario_name];
  const { json, tgz } = scenario.task_input_file;

  const required: ('json' | 'tgz')[] = [];
  if (json.required) required.push('json');
  if (tgz.required) required.push('tgz');

  // If required input files are not present, return
  for (const req of required) {
    const file = files[req];
    if (!file) {
      HttpResponse.BadRequest(ctx, `Missing '${req}' file as part of input`);
      return;
    }
  }

  // Copy required files to destination
  for (const req of required) {
    const file = files[req];
    if (file instanceof Array) {
      HttpResponse.BadRequest(ctx, `Multiple '${req}' files provided`);
      return;
    }
  }

  // Copy the files to a temp folder
  const timestamp = new Date().toISOString();
  const uniqueName = `${task.id}-${timestamp}`;
  const localFolder = envGetString('LOCAL_FOLDER');
  const folderPath = `${process.cwd()}/${localFolder}/task-input/${uniqueName}`;
  const jsonFilePath = json.required ? `${folderPath}/${uniqueName}.json` : undefined;
  const tgzFilePath = tgz.required ? `${folderPath}/${uniqueName}.tgz` : undefined;

  try {
    await fsp.mkdir(folderPath);

    // Copy required files to destination
    if (tgz.required) {
      const file = files['tgz'];
      // @ts-ignore Already checked that file is not an instance of array
      const filePath: string = file.path;
      await fsp.copyFile(filePath, `${folderPath}/${uniqueName}.tgz`);
      await fsp.unlink(filePath);
    }

    // Copy required files to destination
    if (json.required) {
      const file = files['json'];
      if (!(file instanceof Array)) {
        const path = file.path;
        const name = file.name;
        if (name.endsWith('json')) {
          await fsp.copyFile(path, `${folderPath}/${uniqueName}.json`);
        } else if (name.endsWith('csv')) {
          const csvData = await fsp.readFile(path);
          const jsonData = csvToJson(csvData.toString());
          await fsp.writeFile(`${folderPath}/${uniqueName}.json`, jsonData);
        }
        await fsp.unlink(path);
      }
    }

    // Tar input blob parameter
    const inputBlobParams: BlobParameters = {
      cname: 'task-input',
      task_id: task.id,
      timestamp: timestamp.replace(/:/g, '.'),
      ext: 'tgz',
    };
    const inputBlobName = getBlobName(inputBlobParams);
    const inputBlobPath = `${folderPath}/${inputBlobName}`;

    // Create the karya file
    const fileList = required.map((req) => `${uniqueName}.${req}`);
    await tar.create({ C: folderPath, gzip: true, file: inputBlobPath }, fileList);
    const karyaFile = await upsertKaryaFile(inputBlobPath, 'MD5', inputBlobParams);

    // Create the task operation
    const taskOp = await BasicModel.insertRecord('task_op', {
      task_id: task.id,
      op_type: 'PROCESS_INPUT',
      file_id: karyaFile.id,
      status: 'CREATED',
      messages: { messages: [] },
    });

    // Asynchronously process the input
    await inputProcessorQ.add({ task, jsonFilePath, tgzFilePath, folderPath, taskOp });

    // Return success response with the task op record
    HttpResponse.OK(ctx, taskOp);
  } catch (e) {
    // TODO: internal server error
    HttpResponse.BadRequest(ctx, 'Something went wrong');
    return;
  }
};

/**
 * Trigger output file generation for the given task
 */
export const generateOutput: TaskRouteMiddleware = async (ctx) => {
  const task = ctx.state.task;

  // Check the last time output was generated for this task
  const latestOpTime = await TaskOpModel.latestOpTime(task.id, 'GENERATE_OUTPUT');
  const diff = new Date().getTime() - new Date(latestOpTime).getTime();
  if (diff < 1 * 1 * 60 * 1000) {
    HttpResponse.BadRequest(ctx, 'Insufficient time gap between two output generations');
    return;
  }

  try {
    // Create a output generation task op
    const taskOp = await BasicModel.insertRecord('task_op', {
      task_id: task.id,
      op_type: 'GENERATE_OUTPUT',
      status: 'CREATED',
      messages: { messages: [] },
    });

    await outputGeneratorQ.add({ task, taskOp });
    HttpResponse.OK(ctx, taskOp);
  } catch (e) {
    HttpResponse.BadRequest(ctx, 'Unknown error occured');
  }
};

/**
 * Get input and output files of a task
 */
export const getFiles: TaskRouteMiddleware = async (ctx) => {
  const task = ctx.state.task as TaskRecordType;
  const records = await BasicModel.getRecords('task_op', { task_id: task.id }, [
    ['op_type', ['PROCESS_INPUT', 'GENERATE_OUTPUT']],
  ]);

  await BBPromise.mapSeries(records, async (r) => {
    if (r.file_id) {
      const fileRecord = await BasicModel.getSingle('karya_file', { id: r.file_id });
      const url = fileRecord.url ? getBlobSASURL(fileRecord.url, 'r') : null;
      r.extras = { url };
    }
  });
  HttpResponse.OK(ctx, records);
};

/**
 * Get all microtask info for a particular task. Add additional info about
 * microtask assignments to the extras object.
 */
export const getMicrotasksSummary: TaskRouteMiddleware = async (ctx) => {
  const records = await MicrotaskModel.microtasksWithAssignmentSummary(ctx.state.task.id);
  HttpResponse.OK(ctx, records);
};

/**
 * Get summary info for all tasks
 */
export const getTasksSummary: TaskRouteMiddleware = async (ctx) => {
  try {
    const force_refresh = ctx.query.refresh === 'true' ? true : false;
    const records = await TaskModel.tasksSummary(force_refresh);
    await BBPromise.mapSeries(records, async (r) => {
      // TODO: Commenting the below lines due to performance issues
      // const scenario = backendScenarioMap[r.scenario_name as ScenarioName];
      // const data = await scenario.getTaskData(r.id);
      r.extras.data = {};
      return r;
    });
    HttpResponse.OK(ctx, records);
  } catch (e) {
    // TODO: Convert this to an internal server error
    console.log(e);
    HttpResponse.BadRequest(ctx, 'Unknown error');
  }
};

/**
 * Get all worker info for a particular task
 */
export const getWorkersTaskSummary: TaskRouteMiddleware = async (ctx) => {
  try {
    const force_refresh = ctx.query.refresh === 'true' ? true : false;
    const task = ctx.state.task as TaskRecordType;
    const records = await WorkerModel.workersTaskSummary(task.id, force_refresh);
    HttpResponse.OK(ctx, records);
  } catch (e) {
    // TODO: Convert this to an internal server error
    HttpResponse.BadRequest(ctx, 'Unknown error');
  }
};

/**
 * Mark task as completed
 */
export const markComplete: TaskRouteMiddleware = async (ctx) => {
  const task = ctx.state.task as TaskRecordType;
  const updatedRecord = await BasicModel.updateSingle('task', { id: task.id }, { status: 'COMPLETED' });
  // Mark all task_assignments as completed
  await BasicModel.updateRecords('task_assignment', { task_id: task.id }, { status: 'COMPLETED' });
  HttpResponse.OK(ctx, updatedRecord);
};

/**
 * Edit a task
 */
export const editTask: UserRouteMiddleware = async (ctx) => {
  try {
    const task: Task = ctx.request.body;

    // TODO: Validate the task object

    // Validate the task parameters
    const scenario = scenarioMap[task.scenario_name!];
    const policy = policyMap[task.policy!];

    const schema = joiSchema(scenario.task_input.concat(policy.params).concat(coreScenarioParameters));
    const { value: params, error: paramsError } = schema.validate(task.params);

    if (paramsError) {
      HttpResponse.BadRequest(ctx, 'Invalid task parameters');
      return;
    }

    // update params
    task.params = params;

    // update other fields
    task.status = 'SUBMITTED';

    try {
      const updatedRecord = await BasicModel.updateSingle('task', { id: task.id }, task);
      // Mark all task_assignments as updated so that the task updates can be
      // pushed to the respective boxes.
      // TODO: This is a hack. Can potentially be implemented more efficiently
      await BasicModel.updateRecords('task_assignment', { task_id: task.id }, {});
      HttpResponse.OK(ctx, updatedRecord);
    } catch (e) {
      // Internal server error
      HttpResponse.BadRequest(ctx, 'Unknown error occured');
    }
  } catch (e) {
    HttpResponse.BadRequest(ctx, 'Unknown error occured');
  }
};
