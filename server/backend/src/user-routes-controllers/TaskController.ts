// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Handler for task related routes

import { UserRouteMiddleware } from '../routes/UserRoutes';
import * as HttpResponse from '@karya/http-response';
import { Task, scenarioMap, TaskRecord } from '@karya/core';
import { joiSchema } from '@karya/parameter-specs';
import { BasicModel } from '@karya/common';

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
 * Submit input files for a task
 */
export const submitInputFiles: UserRouteMiddleware = async (ctx) => {};
