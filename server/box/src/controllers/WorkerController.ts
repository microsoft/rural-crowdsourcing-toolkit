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
    const worker = {
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
    };
    HttpResponse.OK(ctx, worker);
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
  ctx.state.entity = { ...record, id_token };

  HttpResponse.OK(ctx, ctx.state.entity);
};

/**
 * Send the generated token as HTTP response
 */
export const sendGeneratedIdToken: KaryaMiddleware = async (ctx) => {
  HttpResponse.OK(ctx, { id_token: ctx.state.entity.id_token });
};
