// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Handler for server user routes

import { BasicModel, ServerUser } from '@karya/common';
import { getCreationCode } from '@karya/misc-utils';
import { KaryaUserRouteMiddleware } from '../routes/UserRoutes';
import * as HttpResponse from '@karya/http-response';

/**
 * Create a new server user. Cannot create an admin through this endpoint.
 */
export const create: KaryaUserRouteMiddleware = async (ctx) => {
  // Get basic box info
  const server_user: ServerUser = ctx.request.body;

  // Generate access code and ensure it is not repeated
  let access_code: string = '';
  while (true) {
    try {
      access_code = getCreationCode({ length: 16, numeric: false });
      await BasicModel.getSingle('server_user', { access_code });
    } catch (e) {
      // Exception indicates that access code is not rpeated
      break;
    }
  }

  // Update box record with access code
  server_user.access_code = access_code;

  try {
    const record = await BasicModel.insertRecord('server_user', server_user);
    HttpResponse.OK(ctx, record);
  } catch (e) {
    // TODO: Convert this to an internal server error
    HttpResponse.BadRequest(ctx, 'Unknown error occured');
  }
};

/**
 * Get all server users.
 */
export const get: KaryaUserRouteMiddleware = async (ctx) => {
  try {
    const records = await BasicModel.getRecords('server_user', {});
    HttpResponse.OK(ctx, records);
  } catch (e) {
    // TODO: Conver this to internal server error
    HttpResponse.BadRequest(ctx, 'Unknown error occured');
  }
};
