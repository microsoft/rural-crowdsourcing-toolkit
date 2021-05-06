// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Handler for authentication related routes

import { BasicModel, ServerUser, verifyGoogleIdToken, UserRegistrationState } from '@karya/common';
import { UserRouteMiddleware, UserRouteState } from '../routes/UserRoutes';
import * as HttpResponse from '@karya/http-response';

export type RegistrationState = UserRouteState<UserRegistrationState<'server_user'>>;
type RegistrationMiddleware = UserRouteMiddleware<UserRegistrationState<'server_user'>>;

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
 * Register a new server user. User details are passed through the body. The
 * registration mechanism and the information are passed through the header.
 */
export const register: RegistrationMiddleware = async (ctx, next) => {
  const serverUserInfo: ServerUser = ctx.request.body;

  // If entity is already registered, forbidden
  if (ctx.state.entity.reg_mechanism) {
    HttpResponse.Forbidden(ctx, 'Record already registered with another user');
    return;
  }

  // Set registration mechanism
  serverUserInfo.reg_mechanism = ctx.state.reg_mechanism;

  if (ctx.state.reg_mechanism == 'google-id-token') {
    // Verify google token
    const verified = await verifyGoogleIdToken(ctx);
    if (!verified) return;
    serverUserInfo.auth_id = ctx.state.auth_id;
  } else {
    HttpResponse.Unavailable(ctx, 'Reg mechanism not supported yet');
    return;
  }

  ctx.state.entity = await BasicModel.updateSingle('server_user', { id: ctx.state.entity.id }, serverUserInfo);
  await next();
};

/**
 * Login a user. Exchange credentials for id token
 */
export const login: RegistrationMiddleware = async (ctx, next) => {
  if (ctx.state.reg_mechanism == 'google-id-token') {
    // Verify token
    const verified = await verifyGoogleIdToken(ctx);
    if (!verified) return;

    // Retrieve the user record
    try {
      ctx.state.entity = await BasicModel.getSingle('server_user', {
        reg_mechanism: 'google-id-token',
        auth_id: ctx.state.auth_id,
      });
    } catch (e) {
      HttpResponse.Unauthorized(ctx, 'No user with this google account');
      return;
    }
  } else {
    HttpResponse.Unavailable(ctx, 'Reg mechanism not supported yet');
    return;
  }

  await next();
};

/**
 * Logout the user. Clear the cookies.
 */
export const logout: UserRouteMiddleware = async (ctx) => {
  ctx.cookies.set('karya-id-token', null, { expires: new Date(0) });
};
