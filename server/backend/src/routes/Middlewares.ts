// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { v4 as uuidv4 } from 'uuid';
import { AuthResponse, verifyIDToken } from '../auth-providers/Index';
import { KaryaMiddleware } from '../controllers/KoaContextType';
import { tableFilterColumns } from '../db/TableFilterColumns.auto';
import { AuthProviderType, DbTableName } from '@karya/db';
import * as BasicModel from '../models/BasicModel';
import { requestLogger } from '../utils/Logger';
import * as HttpResponse from '@karya/http-response';
import { setCookie } from '../controllers/Auth.extra';

/**
 * Middleware to authenticate a request to the server. Depending on the path,
 * this function either ignores authentication, or authenticates a work provider
 * or authenticates a box.
 * @param ctx Koa context
 * @param next Next middleware in the chain
 */
export const authenticateRequest: KaryaMiddleware = async (ctx, next) => {
  // Sign-up routes do not require any authentication
  if (
    ['/api/work_provider/update/cc', '/api/box/update/cc'].includes(ctx.path)
  ) {
    await next();
    return;
  }

  // Routes that need box authentication
  if (ctx.path.startsWith('/api/rbox/')) {
    await authenticateBox(ctx, next);
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
  const { cookies } = ctx;

  // Header authentication only for sign-in request. All other requests should
  // use cookie authentication
  if (ctx.path === '/api/work_provider/sign/in' && header['auth-provider']) {
    // @ts-ignore
    authProvider = header['auth-provider'];
    idToken = header['id-token'] as string;
  } else if (cookies.get('auth-provider') !== undefined) {
    authProvider = cookies.get('auth-provider') as AuthProviderType;
    idToken = cookies.get('id-token') as string;
  } else {
    // no authentication information; Return immediately
    HttpResponse.BadRequest(ctx, ['Missing authenticaton information']);
    return;
  }

  /** Retrive the work provider with the token */
  const response: AuthResponse = await verifyIDToken(authProvider, idToken);

  /** If failed, return immediately */
  if (response.success === false) {
    HttpResponse.Unauthorized(ctx, [response.message]);
    return;
  }

  /** If success, set state and await next */
  const wp = response.wp;
  // TODO: This may not be needed
  wp.id_token = idToken;
  ctx.state.current_user = wp;

  await next();

  // Extend cookies if non-signout request
  if (ctx.state.current_user) {
    const { current_user } = ctx.state;
    setCookie(
      ctx,
      'auth-provider',
      current_user.auth_provider as AuthProviderType,
    );
    setCookie(ctx, 'id-token', current_user.id_token as string);
  } else {
    setCookie(ctx, 'auth-provider', undefined);
    setCookie(ctx, 'id-token', undefined);
  }
};

/**
 * Middleware to authenticate a request from a box. Sets the current_box state
 * to the relevant box record if successful
 * @param ctx Koa context
 * @param next Next middleware to call in the chain
 */
export const authenticateBox: KaryaMiddleware = async (ctx, next) => {
  const { header } = ctx.request;

  // Check if the appropriate header information is provided
  if (!(header['box-id'] && header['id-token'])) {
    HttpResponse.BadRequest(
      ctx,
      'Missing authentication information. Need box-id and id-token',
    );
    return;
  }

  // Retrieve auth information
  const id = header['box-id'] as string;
  const key = header['id-token'] as string;

  // Retrieve the box record
  // TODO: This is currently very rudimentary authentication. Need to make it stronger.
  try {
    const box = await BasicModel.getSingle('box', { id, key });
    ctx.state.current_box = box;
    await next();
  } catch (e) {
    HttpResponse.Unauthorized(ctx, 'Invalid authorization');
    return;
  }
};

/**
 * Middleware to check if the signed-in 'work_provider' is an admin. This
 * middleware should be included in all routes that require admin rights.
 * @param ctx koa request context
 * @param next next middleware in the chain
 */
export const checkAdmin: KaryaMiddleware = async (ctx, next) => {
  if (!ctx.state.current_user || !ctx.state.current_user.admin) {
    HttpResponse.Forbidden(ctx, ['Unauthorized access to resource']);
  } else {
    await next();
  }
};

/**
 * Middleware to extract and add the table name to the context state
 * @param ctx koa request context
 * @param next next middleware in the chain
 */
export const setTableName: KaryaMiddleware = async (ctx, next) => {
  ctx.state.tableName = ctx.path.split('/')[2] as DbTableName;
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
export const logHttpRequests: KaryaMiddleware = async (ctx, next) => {
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
