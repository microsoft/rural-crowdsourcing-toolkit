// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { v4 as uuidv4 } from 'uuid';
import { AuthResponse, verifyIDToken } from '../auth-providers/Index';
import { KaryaMiddleware } from '../controllers/KoaContextType';
import { AuthProviderType, DbTableName, WorkerRecord, tableFilterColumns, BasicModel } from '@karya/common';
import * as HttpResponse from '@karya/http-response';
import { requestLogger } from '../utils/Logger';

/**
 * Middleware to authenticate a request to the server. Depending on the path,
 * this function either ignores authentication or authenticates a user
 * @param ctx Koa context
 * @param next Next middleware in the chain
 */
export const authenticateRequest: KaryaMiddleware = async (ctx, next) => {
  // Sign-up routes do not require any authentication
  // Non-worker resource routes do not require any authentication
  if (
    [
      '/worker/update/cc',
      '/worker/checkin',
      '/worker/phone-auth',
      '/language',
      '/scenario',
      '/supported_languages',
      '/language_resource',
      '/language_resource_value',
      '/file_language_resource_value',
      '/api/messages',
    ].includes(ctx.path) ||
    ctx.path.startsWith('/worker/cc/')
  ) {
    await next();
    return;
  }

  // All other routes need user authentication
  await authenticateUser(ctx, next);
};

/**
 * Middleware to authenticate user and store user state for use by other
 * middlewares
 * @param ctx koa context
 * @param next next middleware in the chain
 */
export const authenticateUser: KaryaMiddleware = async (ctx, next) => {
  let authProvider: AuthProviderType;
  let idToken: string;

  const { header } = ctx.request;

  /** Header authentication  */
  if (header['auth-provider']) {
    // @ts-ignore
    authProvider = header['auth-provider'];
    idToken = header['id-token'] as string;
  } else {
    // no authentication information; Return immediately
    HttpResponse.BadRequest(ctx, ['Missing authenticaton information']);
    return;
  }

  /** Retrieve the work provider with the token */
  const response: AuthResponse = await verifyIDToken(authProvider, idToken);

  let workerRecord: WorkerRecord;

  if (ctx.path == '/worker/refresh_token' && response.wp) {
    workerRecord = await BasicModel.getSingle('worker', { id: response.wp.id });
  } else if (response.success === false) {
    /** If failed, return immediately */
    HttpResponse.Unauthorized(ctx, [response.message]);
    return;
  } else {
    workerRecord = response.wp;
  }

  /** If success, set state and await next */
  const worker = workerRecord;
  worker.id_token = idToken;
  ctx.state.current_user = worker;

  await next();
};

/**
 * Middleware to extract and add the table name to the context state
 * @param ctx koa request context
 * @param next next middleware in the chain
 */
export const setTableName: KaryaMiddleware = async (ctx, next) => {
  ctx.state.tableName = ctx.path.split('/')[1] as DbTableName;
  await next();
};

/**
 * Middleware to extract the filter object from query params
 * @param ctx koa context
 * @param next next middleware in the chain
 */
export const setGetFilter: KaryaMiddleware = async (ctx, next) => {
  const tableName = ctx.state.tableName as DbTableName;
  const filterColumns: string[] = tableFilterColumns[tableName];

  const filter: { [id: string]: any } = {};
  filterColumns.forEach((column) => {
    if (ctx.request.query[column]) {
      filter[column] = ctx.request.query[column];
    }
  });

  ctx.state.filter = filter;
  await next();
};

/**
 * Middleware for http logging
 * @param ctx koa request context
 * @param next next middleware in the chain
 */
export const httpRequestLogger: KaryaMiddleware = async (ctx, next) => {
  const requestId = uuidv4();

  // log the request
  const request = {
    id: requestId,
    method: ctx.method,
    path: ctx.path,
    query: ctx.request.query,
    size: ctx.request.length,
  };
  requestLogger.info(request);

  const start = Date.now();

  // process the request. catch any unhandled errors
  try {
    await next();
  } catch (e) {
    requestLogger.error(JSON.stringify(e));
    ctx.status = 500;
    ctx.body = 'Internal server error';
  }

  const end = Date.now();

  // log response
  const response = {
    id: requestId,
    status: ctx.status,
    size: ctx.response.length,
    time: end - start,
  };
  if (ctx.status >= 200 && ctx.status < 300) {
    requestLogger.info(response);
  } else {
    requestLogger.error({ ...response, body: ctx.response.body });
  }
};
