// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Middlewares for user routes

import { BoxRouteMiddleware } from '../routes/BoxRoutes';
import * as HttpResponse from '@karya/http-response';
import { KaryaIDTokenHandlerTemplate } from '@karya/common';

// Karya ID token middlewares
const idTokenHandler = KaryaIDTokenHandlerTemplate('box', {
  inCookie: false,
  tokenExpiresIn: '30 days',
});

export const { generateToken, authenticateRequest } = idTokenHandler;

/**
 * Only cross these paths with ID token
 */
export const needIdToken: BoxRouteMiddleware = async (ctx, next) => {
  if (ctx.state.auth_mechanism != 'karya-id-token') {
    HttpResponse.Forbidden(ctx, 'Request needs id-token authentication');
    return;
  }
  await next();
};

/**
 * Return user record
 */
export const respondWithBoxRecord: BoxRouteMiddleware = async (ctx) => {
  HttpResponse.OK(ctx, ctx.state.entity);
};
