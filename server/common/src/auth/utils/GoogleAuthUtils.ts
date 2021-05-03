// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Module to help with google oauth

import Application from 'koa';
import * as HttpResponse from '@karya/http-response';
import { envGetString } from '@karya/misc-utils';
import { OAuth2Client } from 'google-auth-library';

// State for google auth routes
export type GoogleAuthState = {
  auth_id: string;
};

// Google Auth Middleware
type GoogleAuthMiddleware = Application.Middleware<GoogleAuthState>;

/**
 * Middleware to verify a google-generated id token.
 * @param entityType Name of the entity: server_user or worker
 */
export const verifyGoogleIdToken: GoogleAuthMiddleware = async (ctx, next) => {
  // Extract google ID token from header
  const idToken = ctx.request.header['google-id-token'];

  // Check if the id token is valid
  if (!idToken || idToken instanceof Array) {
    HttpResponse.BadRequest(ctx, 'Missing or multiple google id tokens');
    return;
  }

  // Get google client id
  let audience: string;
  try {
    audience = envGetString('GOOGLE_CLIENT_ID');
  } catch (e) {
    HttpResponse.Unavailable(ctx, 'Server unable to accept google tokens');
    return;
  }

  // Verify token
  try {
    const client = new OAuth2Client(audience);
    const ticket = await client.verifyIdToken({ idToken, audience });
    const auth_id = ticket.getUserId();
    if (!auth_id) throw new Error('No auth_id with token');
    ctx.state.auth_id = auth_id;
    if (next) await next();
    else HttpResponse.OK(ctx, {});
  } catch (e) {
    HttpResponse.Unauthorized(ctx, 'Invalid token');
    return;
  }
};
