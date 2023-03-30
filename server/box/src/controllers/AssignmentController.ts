// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Handlers for all assignment related routes

import { KaryaMiddleware } from '../KoaContextState';
import * as HttpResponse from '@karya/http-response';
import { MicrotaskAssignmentRecord } from '@karya/core';
import { BasicModel } from '@karya/common';
import { Promise as BBPromise } from 'bluebird';
import { assignMicrotasksForWorker } from '../assignments/AssignmentService';

/**
 * Get list of (new or verified) assignments for a worker
 * @param ctx Karya request context
 */
export const get: KaryaMiddleware = async (ctx) => {
  const worker = ctx.state.entity;
  const assignment_type = ctx.request.query.type;
  const from = ctx.request.query.from;

  // Check assignment type
  if (assignment_type != 'new' && assignment_type != 'verified') {
    HttpResponse.BadRequest(ctx, 'Invalid assignment type');
    return;
  }

  // Check if from is valid
  // TODO: Check if from is formatted correctly
  if (!from || from instanceof Array) {
    HttpResponse.BadRequest(ctx, 'Missing or invalid from time');
    return;
  }

  if (assignment_type == 'verified') {
    const records = await BasicModel.getRecords(
      'microtask_assignment',
      { worker_id: worker.id, status: 'VERIFIED' },
      [],
      [['verified_at', from, null]],
      'verified_at'
    );
    HttpResponse.OK(ctx, records);
  } else {
    // TODO: Adjust max credits
    await assignMicrotasksForWorker(worker, 1000);
    const assignments = await BasicModel.getRecords(
      'microtask_assignment',
      { worker_id: worker.id, status: 'ASSIGNED' },
      [],
      [['created_at', from, null]],
      'created_at'
    );
    const mtIds = assignments.map((mta) => mta.microtask_id);
    const microtasks = await BasicModel.getRecords('microtask', {}, [['id', mtIds]]);
    // This can be optimized to just be distinct task_ids
    const taskIds = microtasks.map((t) => t.task_id);
    const tasks = await BasicModel.getRecords('task', {}, [['id', taskIds]]);
    HttpResponse.OK(ctx, { tasks, microtasks, assignments });
  }
};

/**
 * Submitted completed or skipped assignments to the server
 * @param ctx Karya request context
 */
export const submit: KaryaMiddleware = async (ctx) => {
  const worker = ctx.state.entity;
  const assignments: MicrotaskAssignmentRecord[] = ctx.request.body;

  // TODO: Need to validate incoming request

  try {
    const ids: string[] = [];
    const submitted_to_box_at = new Date().toISOString();
    await BBPromise.mapSeries(assignments, async (assignment) => {
      if (assignment.worker_id != worker.id) {
        // TODO: Internally log this error. User does not have access to assignment
      } else if (assignment.status != 'COMPLETED') {
        // TODO: Internally log this error. Can only submit completed
        // assignments through this route
      } else {
        const { id, ...updates } = assignment;
        await BasicModel.updateSingle('microtask_assignment', { id }, { ...updates, submitted_to_box_at });
        if (assignment.status == 'COMPLETED') {
          // TODO: Handle microtask assignment completion, by invoking policy
        }
        ids.push(id);
      }
    });

    HttpResponse.OK(ctx, ids);
  } catch (e) {
    HttpResponse.Forbidden(ctx, 'Cannot access assignments');
  }
};

/**
 * Submitted completed or skipped assignments to the server
 * @param ctx Karya request context
 */
export const submitSkipped: KaryaMiddleware = async (ctx) => {
  const worker = ctx.state.entity;
  const assignments: MicrotaskAssignmentRecord[] = ctx.request.body;

  // TODO: Need to validate incoming request

  try {
    const ids: string[] = [];
    const submitted_to_box_at = new Date().toISOString();
    await BBPromise.mapSeries(assignments, async (assignment) => {
      if (assignment.worker_id != worker.id) {
        // TODO: Internally log this error. User does not have access to assignment
      } else if (assignment.status != 'SKIPPED') {
        // TODO: Internally log this error. Can only submit completed
        // assignments through this route
      } else {
        const { id, ...updates } = assignment;
        await BasicModel.updateSingle('microtask_assignment', { id }, { ...updates, submitted_to_box_at });
        ids.push(id);
      }
    });

    HttpResponse.OK(ctx, ids);
  } catch (e) {
    HttpResponse.Forbidden(ctx, 'Cannot access assignments');
  }
};
