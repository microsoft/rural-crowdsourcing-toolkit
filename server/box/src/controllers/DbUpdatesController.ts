// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Controllers to send/receive updates from worker
 */

import { WorkerRecord } from '@karya/common';
import {
  applyUpdatesFromWorker,
  getUpdatesForWorker,
  TableUpdates,
  WorkerUpdatableTables,
} from '../models/DbUpdatesModel';
import { assignMicrotasksForWorker } from '../scenarios/AssignmentService';
import * as HttpResponse from '@karya/http-response';
import logger, { requestLogger } from '../utils/Logger';
import { KaryaHTTPContext } from './KoaContextType';

/**
 * Receive updates from the worker and apply them to the box DB
 * @param ctx Koa context
 */
export async function receiveUpdatesFromWorker(ctx: KaryaHTTPContext) {
  // Extract updates from context
  const updates: TableUpdates<WorkerUpdatableTables>[] = ctx.request.body;

  requestLogger.info({
    message: 'receiving updates from worker',
    worker_id: ctx.state.current_user.id,
    creation_code: ctx.state.current_user.access_code,
  });

  // Apply the updates
  try {
    await applyUpdatesFromWorker(ctx.state.current_user, updates);
    HttpResponse.OK(ctx, {});
  } catch (e) {
    logger.error(JSON.stringify(e));
    HttpResponse.BadRequest(ctx, 'Error while applying updates');
  }
}

/**
 * Collect and send updates for a worker
 * @param ctx Koa context
 */
export async function sendUpdatesForWorker(ctx: KaryaHTTPContext) {
  // Get worker record from context
  const current_user = ctx.state.current_user;
  const worker: WorkerRecord = ctx.request.body;

  // Match worker record id with current user
  if (worker.id !== current_user.id) {
    HttpResponse.BadRequest(ctx, 'Request updates from different worker');
    return;
  }

  requestLogger.info({
    message: 'sending updates to worker',
    worker_id: current_user.id,
    creation_code: current_user.access_code,
  });

  // Check if new microtasks can be assigned to the worker
  try {
    await assignMicrotasksForWorker(worker, 500);
  } catch (e) {
    logger.error(JSON.stringify(e));
    HttpResponse.BadRequest(ctx, 'Error while assigning tasks to worker');
    return;
  }

  // Get all updates for the box
  try {
    const updates = await getUpdatesForWorker(worker);
    HttpResponse.OK(ctx, updates);
  } catch (e) {
    logger.error(JSON.stringify(e));
    HttpResponse.BadRequest(ctx, 'Error while collecting updates');
  }
}
