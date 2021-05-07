// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Handler for task related routes

import { UserRouteMiddleware, UserRouteState } from '../routes/UserRoutes';
import * as HttpResponse from '@karya/http-response';
import { Task, scenarioMap, TaskRecord, getBlobName, BlobParameters } from '@karya/core';
import { joiSchema } from '@karya/parameter-specs';
import { BasicModel } from '@karya/common';
import { envGetString } from '@karya/misc-utils';
import { promises as fsp } from 'fs';
import * as tar from 'tar';
import { upsertKaryaFile } from '../models/KaryaFileModel';

// Task route state for routes dealing with a specific task
type TaskState = { task: TaskRecord };
type TaskRouteMiddleware = UserRouteMiddleware<TaskState>;
export type TaskRouteState = UserRouteState<TaskState>;

/**
 * Create a new task.
 */
export const create: UserRouteMiddleware = async (ctx) => {
  const user = ctx.state.entity;
  const task: Task = ctx.request.body;

  // Set the work provider id
  task.work_provider_id = user.id;

  // TODO: Validate the task object

  // Validate the task parameters
  const scenario = scenarioMap[task.scenario_name!];
  const schema = joiSchema(scenario.task_input);
  const { value: params, error: paramsError } = schema.validate(task.params);

  if (paramsError) {
    HttpResponse.BadRequest(ctx, 'Invalid task parameters');
    return;
  }

  // update params
  task.params = params;

  // update other fields
  task.tags = { tags: [] };
  task.status = 'submitted';

  try {
    const insertedRecord = await BasicModel.insertRecord('task', task);
    HttpResponse.OK(ctx, insertedRecord);
  } catch (e) {
    // Internal server error
    console.log(e);
    HttpResponse.BadRequest(ctx, 'Unknown error occured');
  }
};

/**
 * Get all tasks.
 */
export const getAll: UserRouteMiddleware = async (ctx) => {
  try {
    const user = ctx.state.entity;
    const filter: Task = user.role == 'work_provider' ? { work_provider_id: ctx.state.entity.id } : {};
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
    ctx.state.task = await BasicModel.getSingle('task', { id: task_id });
  } catch (e) {
    HttpResponse.NotFound(ctx, 'Requested task not found');
    return;
  }

  // Check if the user has access to the task. Allow admins to pass through.
  if (ctx.state.entity.role != 'admin' && ctx.state.task.work_provider_id != ctx.state.entity.id) {
    HttpResponse.Forbidden(ctx, 'User does not have access to the task');
    return;
  }

  await next();
};

/**
 * Submit input files for a task
 */
export const submitInputFiles: TaskRouteMiddleware = async (ctx) => {
  const task = ctx.state.task;
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

  // Copy the files to a temp folder
  const timestamp = new Date().toISOString();
  const uniqueName = `${task.id}-${timestamp}`;
  const localFolder = envGetString('LOCAL_FOLDER');
  const folderPath = `${process.cwd()}/${localFolder}/${uniqueName}`;

  try {
    await fsp.mkdir(folderPath);
  } catch (e) {
    // TODO: internal server error
    HttpResponse.BadRequest(ctx, 'Could not create local folder');
    return;
  }

  // Copy required files to destination
  for (const req of required) {
    const file = files[req];
    if (file instanceof Array) {
      HttpResponse.BadRequest(ctx, `Multiple '${req}' files provided`);
      return;
    }
    await fsp.copyFile(file.path, `${folderPath}/${uniqueName}.${req}`);
  }

  // Tar input blob parameter
  const inputBlobParams: BlobParameters = {
    cname: 'task-input',
    task_id: task.id,
    timestamp,
    ext: 'tgz',
  };
  const inputBlobName = getBlobName(inputBlobParams);
  const inputBlobPath = `${folderPath}/${inputBlobName}`;

  const fileList = required.map((req) => `${uniqueName}.${req}`);
  await tar.create({ C: folderPath, gzip: true, file: inputBlobPath }, fileList);
  const karyaFile = await upsertKaryaFile(inputBlobPath, 'md5', inputBlobParams);
};
