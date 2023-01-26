// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Handlers for all the worker related routes.

import { KaryaMiddleware } from '../KoaContextState';
import * as HttpResponse from '@karya/http-response';
import { BasicModel, WorkerModel } from '@karya/common';
import { Worker } from '@karya/core';

/**
 * Get worker information. Returns relevant properties of the worker record
 * depending on the type of authentication mechanism.
 * @param ctx Karya request context
 */
export const get: KaryaMiddleware = async (ctx) => {
  // extract relevant fields from worker.
  const {
    id,
    access_code,
    reg_mechanism,
    phone_number,
    auth_id,
    id_token,
    full_name,
    year_of_birth,
    gender,
    language,
    tags,
    created_at,
    last_updated_at,
  } = ctx.state.entity;

  // If auth mechanism is id token, then return all relevant fields
  if (ctx.state.auth_mechanism == 'karya-id-token') {
    const id_token = ctx.state.entity.id_token;
    // @ts-ignore
    ctx.state.entity = { ...record, id_token, params: ctx.state.entity.tags };
    HttpResponse.OK(ctx, ctx.state.entity);
  } else if (ctx.state.auth_mechanism == 'access-code') {
    const worker = { id, language, reg_mechanism };
    HttpResponse.OK(ctx, worker);
  }
};

/**
 * Update the profile for the worker.
 * @param ctx Karya request context
 */
export const update: KaryaMiddleware = async (ctx) => {
  // Get updates from the request body
  const profile: Object = ctx.request.body;

  const updatedRecord = await BasicModel.updateSingle(
    'worker',
    { id: ctx.state.entity.id },
    {
      profile: profile,
      profile_updated_at: new Date().toISOString(),
    }
  );
  // @ts-ignore
  updatedRecord.params = updatedRecord.tags;
  HttpResponse.OK(ctx, updatedRecord);
};

/**
 * Register a worker after verifying phone OTP
 */
export const registerWorker: KaryaMiddleware = async (ctx) => {
  // extract relevant fields from worker.
  const now = new Date().toISOString();
  const record = await BasicModel.updateSingle(
    'worker',
    { id: ctx.state.entity.id },
    { reg_mechanism: 'phone-otp', registered_at: now, profile_updated_at: now }
  );
  const id_token = ctx.state.entity.id_token;
  // @ts-ignore
  ctx.state.entity = { ...record, id_token, params: ctx.state.entity.tags };

  HttpResponse.OK(ctx, ctx.state.entity);
};

/**
 * Send the generated token as HTTP response
 */
export const sendGeneratedIdToken: KaryaMiddleware = async (ctx) => {
  HttpResponse.OK(ctx, { id_token: ctx.state.entity.id_token });
};

/**
 * Returns 10 workers with most XP points and one additional leaderboard entry for the worker requesting leaderboard
 */
export const getLeaderboard: KaryaMiddleware = async (ctx) => {
  const workerId = ctx.state.entity.id;
  const worker = await BasicModel.getSingle('worker', { id: workerId });

  const records = await WorkerModel.getLeaderboardRecords(worker);

  // If empty response return empty list
  if (records.length == 0) {
    return HttpResponse.OK(ctx, []);
  }

  const topRecords = records.slice(0, 10);
  const workerLeaderboardrecord = records.find((record) => record.id === workerId)!;
  // Add worker leaderboard record to the leaderboard
  if (workerLeaderboardrecord != undefined) {
    topRecords.push(workerLeaderboardrecord);
  }
  HttpResponse.OK(ctx, topRecords);
};
