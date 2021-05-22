// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Handler for box related routes

import { Box } from '@karya/core';
import { BasicModel } from '@karya/common';
import { getCreationCode } from '@karya/misc-utils';
import { UserRouteMiddleware } from '../routes/UserRoutes';
import * as HttpResponse from '@karya/http-response';

/**
 * Create a new box. Generate a random creation code.
 */
export const create: UserRouteMiddleware = async (ctx) => {
  // Get basic box info
  const box: Box = ctx.request.body;

  // Generate access code and ensure it is not repeated
  let access_code: string = '';
  while (true) {
    try {
      access_code = getCreationCode({ length: 16, numeric: false });
      await BasicModel.getSingle('box', { access_code });
    } catch (e) {
      // Exception indicates that access code is not rpeated
      break;
    }
  }

  // Update box record with access code
  box.access_code = access_code;

  try {
    const record = await BasicModel.insertRecord('box', box);
    HttpResponse.OK(ctx, record);
  } catch (e) {
    // TODO: Convert this to an internal server error
    HttpResponse.BadRequest(ctx, 'Unknown error occured');
  }
};

/**
 * Get all boxes.
 */
export const getAll: UserRouteMiddleware = async (ctx) => {
  try {
    const records = await BasicModel.ngGetRecords('box', {});
    HttpResponse.OK(ctx, records);
  } catch (e) {
    // TODO: Conver this to internal server error
    HttpResponse.BadRequest(ctx, 'Unknown error occured');
  }
};
