// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Handlers for all the worker related routes.

import { KaryaMiddleware } from '../KoaContextState';
import * as HttpResponse from '@karya/http-response';
import { BasicModel } from '@karya/common';
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
 * Update the worker information.
 * @param ctx Karya request context
 */
export const update: KaryaMiddleware = async (ctx) => {
  const action = ctx.request.query['action'];

  // action should be either register or update
  if (action != 'register' && action != 'update') {
    HttpResponse.BadRequest(ctx, 'Missing or invalid action parameter');
    return;
  }

  // Get updates from the request body
  const updates: Worker = ctx.request.body;

  if (action == 'register') {
    const { year_of_birth, gender } = updates;
    if (!year_of_birth || !gender) {
      HttpResponse.BadRequest(ctx, 'Missing year of birth or gender with registration request');
      return;
    }
  }

  // TODO: check if only the updatable properties are updated
  try {
    const updatedRecord = await BasicModel.updateSingle('worker', { id: ctx.state.entity.id }, updates);
    HttpResponse.OK(ctx, updatedRecord);
  } catch (e) {
    // TODO: Convert this to internal server user
    HttpResponse.BadRequest(ctx, 'Something went wrong');
  }
};

/**
 * Register a worker after verifying phone OTP
 */
export const registerWorker: KaryaMiddleware = async (ctx) => {
  // extract relevant fields from worker.
  try {
    const record = await BasicModel.updateSingle(
      'worker',
      { id: ctx.state.entity.id },
      { reg_mechanism: 'phone-otp', registered_at: new Date().toISOString() }
    );
    const id_token = ctx.state.entity.id_token;
    ctx.state.entity = { ...record, id_token };
  } catch (e) {
    // TODO: convert this to internal server error
    HttpResponse.BadRequest(ctx, 'Unknown error occured');
    return;
  }
  HttpResponse.OK(ctx, ctx.state.entity);
};
