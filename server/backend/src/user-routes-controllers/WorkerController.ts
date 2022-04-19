// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Handler for worker related routes

import { UserRouteMiddleware, UserRouteState } from '../routes/UserRoutes';
import * as HttpResponse from '@karya/http-response';
import { WorkerModel, BasicModel, AccessCodeInfo, AccessCodeVersion, generateWorkerCodes } from '@karya/common';
import { LanguageCode } from '@karya/core';
import { envGetNumber } from '@karya/misc-utils';

type WorkerRouteMiddleware = UserRouteMiddleware<{}>;
export type WorkerRouteState = UserRouteState<{}>;

/**
 * Get summary info for all workers
 */
export const getWorkersSummary: WorkerRouteMiddleware = async (ctx) => {
  try {
    const force_refresh = ctx.query.refresh === 'true' ? true : false;
    const records = await WorkerModel.workersSummary(force_refresh);
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

type GenWorkerCodesInfo = {
  box_id: string;
  num_codes: number;
  language: LanguageCode;
  tags: string[];
};

/**
 * Generate new workers for with a specified set of parameters
 */
export const generateNewWorkers: WorkerRouteMiddleware = async (ctx) => {
  // Extract necessary info from the request body
  const info: GenWorkerCodesInfo = ctx.request.body;

  // Get access code parameters
  const env_version = envGetNumber('ACCESS_CODE_VERSION', 0);
  const version = env_version == 1 ? AccessCodeVersion.V1 : AccessCodeVersion.V0;
  const length = envGetNumber('ACCESS_CODE_LENGTH', 16);

  // Get the box record
  const box = await BasicModel.getSingle('box', { id: info.box_id });

  // Generate access code info
  const accessCodeInfo: AccessCodeInfo = {
    version,
    length,
    env: (process.env.NODE_ENV ?? 'prod') as AccessCodeInfo['env'],
    physical_box: box.physical,
    box_url: box.url ?? '',
    server_url: '',
  };

  // Generate the access codes
  const workers = await generateWorkerCodes(box, info.num_codes, info.language, accessCodeInfo, info.tags);

  workers.forEach((worker) => {
    worker.extras = {
      assigned: 0,
      completed: 0,
      verified: 0,
      earned: 0,
    };
  });

  HttpResponse.OK(ctx, workers);
};
