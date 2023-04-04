// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Handlers for all assignment related routes

import { KaryaMiddleware } from '../KoaContextState';
import * as HttpResponse from '@karya/http-response';
import { MicrotaskAssignmentRecord } from '@karya/core';
import { BasicModel, MicrotaskModel } from '@karya/common';
import { Promise as BBPromise } from 'bluebird';
import { assignmentQueue, preassignMicrotasksForWorker } from '../assignments/AssignmentService';

/**
 * Get list of (new or verified) assignments for a worker
 * @param ctx Karya request context
 */
export const get: KaryaMiddleware = async (ctx) => {
  const worker = ctx.state.entity;
  const assignment_type = ctx.request.query.type;
  const from = ctx.request.query.from;
  const limit_param = ctx.request.query.limit;

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

  // Check limit
  if (limit_param instanceof Array) {
    HttpResponse.BadRequest(ctx, 'Invalid limit');
    return;
  }
  const limit = limit_param ? Number.parseInt(limit_param, 10) : 1000;

  if (assignment_type == 'verified') {
    const assignments = await BasicModel.getRecords(
      'microtask_assignment',
      { worker_id: worker.id, status: 'VERIFIED' },
      [],
      [['verified_at', from, null]],
      'verified_at',
      limit
    );

    const completedAssignments = await BasicModel.getRecords(
      'microtask_assignment',
      { worker_id: worker.id, status: 'COMPLETED' },
      [],
      [['completed_at', from, null]],
      'completed_at',
      limit
    )

    // Adding completed asignment as well
    completedAssignments.forEach(assignment => {
      // @ts-ignore sending completed assignments as submitted
      assignment.status = "SUBMITTED"
      assignments.push(assignment)
    })

    const taskIds = new Set(assignments.map((mta) => mta.task_id));
    const tasks = await BasicModel.getRecords('task', {}, [['id', [...taskIds]]]);
    HttpResponse.OK(ctx, { tasks, assignments });
  } else {
    const hasAssigned = await MicrotaskModel.hasIncompleteMicrotasks(worker.id);
    const raniRound2 = worker.tags.tags.includes('rani-round2');
    if (raniRound2) {
      await preassignMicrotasksForWorker(worker, 10000);
    }

    const assignments = hasAssigned
      ? await BasicModel.getRecords('microtask_assignment', { worker_id: worker.id, status: 'ASSIGNED' })
      : await BasicModel.updateRecords(
          'microtask_assignment',
          { worker_id: worker.id, status: 'PREASSIGNED' },
          { status: 'ASSIGNED' }
        );

    const mtIds = assignments.map((mta) => mta.microtask_id);
    const microtasks = await BasicModel.getRecords('microtask', {}, [['id', mtIds]]);
    // This can be optimized to just be distinct task_ids
    const taskIds = microtasks.map((t) => t.task_id);
    const tasks = await BasicModel.getRecords('task', {}, [['id', taskIds]]);
    HttpResponse.OK(ctx, { tasks, microtasks, assignments });

    // Add worker to the preassignment queue
    if (!raniRound2) {
      await assignmentQueue.add(worker);
    }
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
        await BasicModel.updateSingle(
          'microtask_assignment',
          { id },
          { ...updates, submitted_to_box_at, submitted_to_server_at: null }
        );
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
 * Submitted skipped and expired assignments to the server
 * @param ctx Karya request context
 */
export const submitSkippedExpired: KaryaMiddleware = async (ctx) => {
  const worker = ctx.state.entity;
  const assignments: MicrotaskAssignmentRecord[] = ctx.request.body;

  // TODO: Need to validate incoming request

  try {
    const ids: string[] = [];
    const submitted_to_box_at = new Date().toISOString();
    await BBPromise.mapSeries(assignments, async (assignment) => {
      if (assignment.worker_id != worker.id) {
        // TODO: Internally log this error. User does not have access to assignment
      } else if (assignment.status != 'SKIPPED' && assignment.status != 'EXPIRED') {
        // TODO: Internally log this error. Can only submit skipped or expired
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
