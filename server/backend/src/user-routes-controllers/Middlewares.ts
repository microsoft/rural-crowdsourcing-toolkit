// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Middlewares for user routes

import { KaryaUserRouteMiddleware, RegistrationMiddleware } from '../routes/UserRoutes';
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
export const authenticateRequest: KaryaUserRouteMiddleware = async (ctx, next) => {
  // Login route does not need authentication
  if (ctx.path === '/api_user/server_user/login') {
    await next();
    return;
  }

  // All other routes need authenticaton
  await idTokenHandler.authenticateRequest(ctx, next);
};

/**
 * Only allow admins to pass through this middleware
 */
export const onlyAdmin: KaryaUserRouteMiddleware = async (ctx, next) => {
  if (ctx.state.entity.role != 'admin') {
    HttpResponse.Forbidden(ctx, 'Only admin can access this endpoint');
    return;
  }
  await next();
};

/**
 * Set registration/login mechanism
 */
export const setRegMechanism: RegistrationMiddleware = async (ctx, next) => {
  const reg_mechanism = ctx.request.header['reg-mechanism'];

  if (reg_mechanism != 'phone-otp' && reg_mechanism != 'google-id-token') {
    HttpResponse.BadRequest(ctx, 'Invalid registration/login mechanism');
    return;
  }

  ctx.state.reg_mechanism = reg_mechanism;
  await next();
};

/**
 * Return user record
 */
export const respondWithUserRecord: RegistrationMiddleware = async (ctx) => {
  HttpResponse.OK(ctx, ctx.state.entity);
};
