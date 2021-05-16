// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Handler for assignment related box routes

import { BoxRouteMiddleware, BoxRouteState } from '../routes/BoxRoutes';
import * as HttpResponse from '@karya/http-response';
import { BasicModel, getBlobSASURL } from '@karya/common';
import { MicrotaskAssignmentRecord, MicrotaskGroupRecord, MicrotaskRecord, TaskRecord } from '@karya/core';
import { Promise as BBPromise } from 'bluebird';

type TaskState = {
  task: TaskRecord;
  from: string;
  limit: number | undefined;
};

export type TaskRouteState = BoxRouteState<TaskState>;
export type TaskRouteMiddleware = BoxRouteMiddleware<TaskState>;

/**
 * Get list of new and updated task assignments
 */
export const getTaskAssignments: BoxRouteMiddleware = async (ctx) => {
  const from = ctx.request.query.from;

  if (!from || from instanceof Array) {
    HttpResponse.BadRequest(ctx, 'No from time specified');
    return;
  }

  // Get all relevant task assignment and task records
  try {
    const currentTime = new Date().toISOString();
    const task_assignments = await BasicModel.ngGetRecords(
      'task_assignment',
      { box_id: ctx.state.entity.id },
      [],
      [['last_updated_at', from, null]]
    );
    task_assignments.forEach((ta) => {
      ta.received_from_server_at = currentTime;
    });

    const task_ids = task_assignments.map((ta) => ta.task_id);
    const tasks = await BasicModel.ngGetRecords('task', {}, [['id', task_ids]], []);
    HttpResponse.OK(ctx, { task_assignments, tasks });
  } catch (e) {
    // TODO: convert this to internal server error
    HttpResponse.BadRequest(ctx, 'Something went wrong');
  }
};

/**
 * Get microtasks for a given task ordered by last_updated up to the given limit
 */
export const getMicrotasks: TaskRouteMiddleware = async (ctx) => {
  let from = ctx.query.from || new Date(0).toISOString();
  if (from instanceof Array) from = from[0];

  let limitString = ctx.query.limit;
  if (limitString instanceof Array) limitString = limitString[0];
  const limit = limitString ? Number.parseInt(limitString) : undefined;

  const task = ctx.state.task;

  try {
    let microtasks: MicrotaskRecord[];
    let groups: MicrotaskGroupRecord[] = [];

    // Get all groups+microtasks or microtasks
    if (task.assignment_granularity == 'GROUP') {
      groups = await BasicModel.ngGetRecords(
        'microtask_group',
        { task_id: ctx.state.task.id },
        [],
        [['last_updated_at', from, null]],
        'last_updated_at',
        limit
      );
      const group_ids = groups.map((g) => g.id);
      microtasks = await BasicModel.ngGetRecords('microtask', {}, [['group_id', group_ids]]);
    } else {
      microtasks = await BasicModel.ngGetRecords(
        'microtask',
        { task_id: ctx.state.task.id },
        [],
        [['last_updated_at', from, null]],
        'last_updated_at',
        limit
      );
    }

    // Get any input files for these microtasks
    const karya_file_ids = microtasks.map((mt) => mt.input_file_id).filter((id): id is string => id != null);
    const karya_files = await BasicModel.ngGetRecords('karya_file', {}, [['id', karya_file_ids]]);

    // Get SAS tokens for the karya files
    karya_files.forEach((kf) => {
      // Microtask input files should have been uploaded to the blob store
      kf.url = getBlobSASURL(kf.url!, 'r');
    });

    HttpResponse.OK(ctx, { groups, microtasks, karya_files });
  } catch (e) {
    // TODO: Internal server error
    HttpResponse.BadRequest(ctx, 'Unknown error. Could not fetch microtasks');
  }
};

/**
 * Submit new assignments created by the box
 */
export const submitNewAssignments: TaskRouteMiddleware = async (ctx) => {
  const assignments: MicrotaskAssignmentRecord[] = ctx.request.body;

  // get current time
  const sent_to_server_at = new Date().toISOString();

  // Upsert all new assignments
  try {
    const response = await BBPromise.mapSeries(assignments, async (assignment) => {
      await BasicModel.upsertRecord('microtask_assignment', { ...assignment, sent_to_server_at });
      return { id: assignment.id, sent_to_server_at };
    });
    HttpResponse.OK(ctx, response);
  } catch (e) {
    // Conver this to internal server error
    HttpResponse.BadRequest(ctx, 'Unknown error occured while inserting assignments');
  }
};

export const submitCompletedAssignments: TaskRouteMiddleware = async (ctx) => {
  const assignments: MicrotaskAssignmentRecord[] = ctx.request.body;

  // get current time
  const submitted_to_server_at = new Date().toISOString();

  // Upsert all new assignments
  try {
    const response = await BBPromise.mapSeries(assignments, async (assignment) => {
      await BasicModel.upsertRecord('microtask_assignment', { ...assignment, submitted_to_server_at });
      return { id: assignment.id, submitted_to_server_at };
    });

    // TODO: Execute trigger to initiate task chain

    HttpResponse.OK(ctx, response);
  } catch (e) {
    // Conver this to internal server error
    HttpResponse.BadRequest(ctx, 'Unknown error occured while inserting assignments');
  }
};

/**
 * Get all verified assignments for a given task.
 */
export const getVerifiedAssignments: TaskRouteMiddleware = async (ctx) => {
  let from = ctx.query.from || new Date(0).toISOString();
  if (from instanceof Array) from = from[0];

  let limitString = ctx.query.limit;
  if (limitString instanceof Array) limitString = limitString[0];
  const limit = limitString ? Number.parseInt(limitString) : undefined;

  const task = ctx.state.task;

  try {
    const verified = await BasicModel.ngGetRecords(
      'microtask_assignment',
      { task_id: task.id, status: 'verified' },
      [],
      [['verified_at', from, null]],
      'verified_at',
      limit
    );
    HttpResponse.OK(ctx, verified);
  } catch (e) {
    // Conver this to internal server error
    HttpResponse.BadRequest(ctx, 'Unknown error occured while fetching verified assignments');
  }
};

/**
 * Set task from ID in params.
 */
export const setTask: TaskRouteMiddleware = async (ctx, next) => {
  const id = ctx.params.id;

  // Get and set task record
  try {
    ctx.state.task = await BasicModel.getSingle('task', { id });
  } catch (e) {
    HttpResponse.NotFound(ctx, `No task with id ${id}`);
    return;
  }

  await next();
};
