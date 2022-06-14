// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Middlewares for the box server.

import { KaryaMiddleware } from '../KoaContextState';
import * as HttpResponse from '@karya/http-response';

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
