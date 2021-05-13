// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Middlewares for the box server.

import { KaryaMiddleware } from '../KoaContextState';
import * as HttpResponse from '@karya/http-response';
import { v4 as uuidv4 } from 'uuid';
import { requestLogger } from '../utils/Logger';

/**
 * Middleware to include in routes that need id-token authentication. Returns
 * forbidden if auth mechanism is not id-token.
 * @param ctx Karya request context
 * @param next Next middleware in the chain to call
 */
export const needIdToken: KaryaMiddleware = async (ctx, next) => {
  if (ctx.state.auth_mechanism != 'karya-id-token') {
    HttpResponse.Forbidden(ctx, 'Request needs id-token authenticaton');
    return;
  }
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
