// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Handler for box authentication related routes

import { BasicModel } from '@karya/common';
import { Box } from '@karya/core';
import { BoxRouteMiddleware } from '../routes/BoxRoutes';
import * as HttpResponse from '@karya/http-response';

export const register: BoxRouteMiddleware = async (ctx, next) => {
  // Extract box object from body
  const box: Box = ctx.request.body;

  // TODO: Validate box

  // Update box with registration info
  try {
    ctx.state.entity = await BasicModel.updateSingle(
      'box',
      { id: ctx.state.entity.id },
      { ...box, reg_mechanism: 'self-gen-key' }
    );
  } catch (e) {
    // TODO: convert this to internal server error
    console.log(e);
    HttpResponse.BadRequest(ctx, 'Unknown error occured');
    return;
  }

  await next();
};
