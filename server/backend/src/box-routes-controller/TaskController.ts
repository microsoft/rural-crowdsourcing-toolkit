// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Handler for assignment related box routes

import { BoxRouteMiddleware, BoxRouteState } from '../routes/BoxRoutes';
import * as HttpResponse from '@karya/http-response';
import { BasicModel, getBlobSASURL } from '@karya/common';
import { MicrotaskAssignmentRecord, MicrotaskGroupRecord, MicrotaskRecord, TaskRecordType } from '@karya/core';
import { Promise as BBPromise } from 'bluebird';
import { forwardTaskLinkQ } from '../task-ops/Index';

type TaskState = {
  task: TaskRecordType;
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
  const currentTime = new Date().toISOString();
  const task_assignments = await BasicModel.getRecords(
    'task_assignment',
    { box_id: ctx.state.entity.id },
    [],
    [['last_updated_at', from, null]]
  );
  task_assignments.forEach((ta) => {
    ta.received_from_server_at = currentTime;
  });

  const task_ids = task_assignments.map((ta) => ta.task_id);
  const tasks = await BasicModel.getRecords('task', {}, [['id', task_ids]], []);
  HttpResponse.OK(ctx, { task_assignments, tasks });
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

  let microtasks: MicrotaskRecord[];
  let groups: MicrotaskGroupRecord[] = [];

  // Get all groups+microtasks or microtasks
  if (task.assignment_granularity == 'GROUP') {
    groups = await BasicModel.getRecords(
      'microtask_group',
      { task_id: ctx.state.task.id },
      [],
      [['last_updated_at', from, null]],
      'last_updated_at',
      limit
    );
    const group_ids = groups.map((g) => g.id);
    microtasks = await BasicModel.getRecords('microtask', {}, [['group_id', group_ids]]);
  } else {
    microtasks = await BasicModel.getRecords(
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
  const karya_files = await BasicModel.getRecords('karya_file', {}, [['id', karya_file_ids]]);

  // Get SAS tokens for the karya files
  karya_files.forEach((kf) => {
    // Microtask input files should have been uploaded to the blob store
    kf.url = getBlobSASURL(kf.url!, 'r');
  });

  HttpResponse.OK(ctx, { groups, microtasks, karya_files });
};

/**
 * Submit new assignments created by the box
 */
export const submitNewAssignments: TaskRouteMiddleware = async (ctx) => {
  const assignments: MicrotaskAssignmentRecord[] = ctx.request.body;

  // get current time
  const sent_to_server_at = new Date().toISOString();

  // Upsert all new assignments
  const response = await BBPromise.mapSeries(assignments, async (assignment) => {
    await BasicModel.upsertRecord('microtask_assignment', { ...assignment, sent_to_server_at });
    return { id: assignment.id, sent_to_server_at };
  });
  HttpResponse.OK(ctx, response);
};

/**
 * Submit completed assignments from the box
 */
export const submitCompletedAssignments: TaskRouteMiddleware = async (ctx) => {
  const assignments: MicrotaskAssignmentRecord[] = ctx.request.body;

  // get current time
  const submitted_to_server_at = new Date().toISOString();

  // Upsert all new assignments
  const response = await BBPromise.mapSeries(assignments, async (assignment) => {
    if (assignment.status == 'COMPLETED') {
      assignment.base_credits = assignment.max_base_credits;
    }
    await BasicModel.upsertRecord('microtask_assignment', { ...assignment, submitted_to_server_at });
    return { id: assignment.id, submitted_to_server_at };
  });

  HttpResponse.OK(ctx, response);
};

/**
 * Execute the task links for a particular task
 */
export const executeTaskLinks: TaskRouteMiddleware = async (ctx) => {
  const task = ctx.state.task;

  const taskOp = await BasicModel.insertRecord('task_op', {
    task_id: task.id,
    op_type: 'EXECUTE_FORWARD_TASK_LINK',
    status: 'CREATED',
  });

  await forwardTaskLinkQ.add({ task, taskOp });
  HttpResponse.OK(ctx, {});
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

  const verified = await BasicModel.getRecords(
    'microtask_assignment',
    { task_id: task.id, status: 'VERIFIED' },
    [],
    [['verified_at', from, null]],
    'verified_at',
    limit
  );
  HttpResponse.OK(ctx, verified);
};

/**
 * Set task from ID in params.
 */
export const setTask: TaskRouteMiddleware = async (ctx, next) => {
  const id = ctx.params.id;

  // Get and set task record
  try {
    ctx.state.task = (await BasicModel.getSingle('task', { id })) as TaskRecordType;
  } catch (e) {
    HttpResponse.NotFound(ctx, `No task with id ${id}`);
    return;
  }

  await next();
};
