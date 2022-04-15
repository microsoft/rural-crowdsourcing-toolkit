// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Handler for worker related routes

import { UserRouteMiddleware, UserRouteState } from '../routes/UserRoutes';
import * as HttpResponse from '@karya/http-response';
import { WorkerModel } from '@karya/common';

type WorkerRouteMiddleware = UserRouteMiddleware<{}>;
export type WorkerRouteState = UserRouteState<{}>;

/**
 * Get summary info for all workers
 */
export const getWorkersSummary: WorkerRouteMiddleware = async (ctx) => {
  try {
    const records = await WorkerModel.workersSummary();
    HttpResponse.OK(ctx, records);
  } catch (e) {
    // TODO: Convert this to an internal server error
    HttpResponse.BadRequest(ctx, 'Unknown error');
  }
};

/**
 * Mark a worker as disabled
 */
export const markDisabled: WorkerRouteMiddleware = async (ctx) => {
  const worker_id: string = ctx.params.id;
  const worker = await WorkerModel.markDisabled(worker_id);
  HttpResponse.OK(ctx, worker);
};
