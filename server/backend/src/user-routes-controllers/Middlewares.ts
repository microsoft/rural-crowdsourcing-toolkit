// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Middlewares for user routes

import { UserRouteMiddleware } from '../routes/UserRoutes';
import * as HttpResponse from '@karya/http-response';
import { KaryaIDTokenHandlerTemplate } from '@karya/common';

// Karya ID token middlewares
const idTokenHandler = KaryaIDTokenHandlerTemplate('server_user', {
  inCookie: true,
  tokenExpiresIn: '12h',
  cookieOptions: { httpOnly: true, secure: false },
});
export const generateToken = idTokenHandler.generateToken;

/**
 * Authenticate an incoming request. All paths except login must have either
 * karya-id-token or access-code authentication.
 */
export const authenticateRequest: UserRouteMiddleware = async (ctx, next) => {
  // Login route does not need authentication
  if (ctx.path === '/api_user/server_user/login') {
    await next();
    return;
  }

  // All other routes need authenticaton
  await idTokenHandler.authenticateRequest(ctx, next);
};

/**
 * Only cross these paths with ID token
 */
export const needIdToken: UserRouteMiddleware = async (ctx, next) => {
  if (ctx.state.auth_mechanism != 'karya-id-token') {
    HttpResponse.Forbidden(ctx, 'Request needs id-token authentication');
    return;
  }
  await next();
};

/**
 * Only allow admins to pass through this middleware
 */
export const onlyAdmin: UserRouteMiddleware = async (ctx, next) => {
  if (ctx.state.entity.role != 'ADMIN') {
    HttpResponse.Forbidden(ctx, 'Only admin can access this endpoint');
    return;
  }
  await next();
};

/**
 * Return user record
 */
export const respondWithUserRecord: UserRouteMiddleware = async (ctx) => {
  HttpResponse.OK(ctx, ctx.state.entity);
};
