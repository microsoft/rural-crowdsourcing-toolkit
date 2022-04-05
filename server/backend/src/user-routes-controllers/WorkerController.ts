// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Handler for worker related routes

import { UserRouteMiddleware, UserRouteState } from '../routes/UserRoutes';
import * as HttpResponse from '@karya/http-response';
import { WorkerRecord } from '@karya/core';
import { WorkerModel } from '@karya/common';

type WorkerState = { worker: WorkerRecord };
type WorkerRouteMiddleware = UserRouteMiddleware<WorkerState>;
export type WorkerRouteState = UserRouteState<WorkerState>;

/**
 * Get summary info for all workers
 */
export const getWorkersSummary: WorkerRouteMiddleware = async (ctx) => {
  try {
    const force_refresh = ctx.params.refresh;
    const records = await WorkerModel.workersSummary(force_refresh);
    HttpResponse.OK(ctx, records);
  } catch (e) {
    // TODO: Convert this to an internal server error
    HttpResponse.BadRequest(ctx, 'Unknown error');
  }
};
