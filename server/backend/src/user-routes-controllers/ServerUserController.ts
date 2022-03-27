// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Handler for server user routes

import { BasicModel } from '@karya/common';
import { ServerUser } from '@karya/core';
import { getCreationCode } from '@karya/misc-utils';
import { UserRouteMiddleware } from '../routes/UserRoutes';
import * as HttpResponse from '@karya/http-response';
import * as TokenAuthHandler from '../utils/auth/tokenAuthoriser/tokenAuthHandler/TokenAuthHandler';

/**
 * Create a new server user. Cannot create an admin through this endpoint.
 */
export const create: UserRouteMiddleware = async (ctx) => {
  // Get basic box info
  const server_user: ServerUser = ctx.request.body;

  if (server_user.role === 'ADMIN') {
    return HttpResponse.BadRequest(ctx, 'Cannot create user with ADMIN role');
  }

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

  const record = await BasicModel.insertRecord('server_user', server_user);
  // Assign work-provider role
  await TokenAuthHandler.assignRole(record, server_user.role!);
  HttpResponse.OK(ctx, record);
};

/**
 * Get all server users.
 */
export const getAll: UserRouteMiddleware = async (ctx) => {
  const records = await BasicModel.getRecords('server_user', {});
  HttpResponse.OK(ctx, records);
};
