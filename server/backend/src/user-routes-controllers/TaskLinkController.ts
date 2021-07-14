// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Handler for chain related routes

import { BasicModel } from '@karya/common';
import { TaskLink, TaskRecordType } from '@karya/core';
import { UserRouteMiddleware, UserRouteState } from '../routes/UserRoutes';
import * as HttpResponse from '@karya/http-response';

type TaskState = { task: TaskRecordType };
type TaskRouteMiddleware = UserRouteMiddleware<TaskState>;
export type TaskRouteState = UserRouteState<TaskState>;

/**
 * Create a new task link
 */
export const create: TaskRouteMiddleware = async (ctx) => {
  const taskLink: TaskLink = ctx.request.body;
  taskLink.status = 'ACTIVE';

  const record = await BasicModel.insertRecord('task_link', taskLink);
  HttpResponse.OK(ctx, record);
};

/**
 * Get all task links
 */
export const get: TaskRouteMiddleware = async (ctx) => {
  const task = ctx.state.task as TaskRecordType;
  const records = await BasicModel.getRecords('task_link', { from_task: task.id });
  HttpResponse.OK(ctx, records);
};
