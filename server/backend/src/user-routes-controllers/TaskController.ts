// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Handler for task related routes

import { KaryaUserRouteMiddleware } from '../routes/UserRoutes';
import * as HttpResponse from '@karya/http-response';
import { BasicModel, Task } from '@karya/common';

/**
 * Create a new task.
 */
export const create: KaryaUserRouteMiddleware = async (ctx) => {};

/**
 * Submit input files for a task
 */
export const submitInputFiles: KaryaUserRouteMiddleware = async (ctx) => {};

/**
 * Get all tasks.
 */
export const getAll: KaryaUserRouteMiddleware = async (ctx) => {
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
