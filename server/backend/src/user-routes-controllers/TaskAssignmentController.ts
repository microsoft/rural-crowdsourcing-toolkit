// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Handler for task assignment related routes

import { BasicModel } from '@karya/common';
import { policyMap, TaskAssignment } from '@karya/core';
import { UserRouteMiddleware } from '../routes/UserRoutes';
import * as HttpResponse from '@karya/http-response';
import { joiSchema } from '@karya/parameter-specs';

/**
 * Create a new task assignment.
 */
export const create: UserRouteMiddleware = async (ctx) => {
  // Get task assignment info
  const task_assignment: TaskAssignment = ctx.request.body;

  // Validate the policy params
  const policy = task_assignment.policy!;
  const params = task_assignment.params;

  const policyObj = policyMap[policy];
  const schema = joiSchema(policyObj.params);
  const { error, value } = schema.validate(params);

  if (error) {
    HttpResponse.BadRequest(ctx, 'Invalid policy parameters');
    return;
  }

  task_assignment.params = value;

  try {
    const record = await BasicModel.insertRecord('task_assignment', task_assignment);
    HttpResponse.OK(ctx, record);
  } catch (e) {
    // TODO: Convert this to an internal server error
    HttpResponse.BadRequest(ctx, 'Unknown error occured');
  }
};

/**
 * Get all task assignments.
 */
export const get: UserRouteMiddleware = async (ctx) => {
  try {
    const records = await BasicModel.ngGetRecords('task_assignment', {});
    HttpResponse.OK(ctx, records);
  } catch (e) {
    // TODO: Conver this to an internal server error
    HttpResponse.BadRequest(ctx, 'Unknown error occured');
  }
};
