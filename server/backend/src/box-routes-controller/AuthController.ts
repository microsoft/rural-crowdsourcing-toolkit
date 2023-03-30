// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Handler for box authentication related routes

import { BasicModel } from '@karya/common';
import { Box } from '@karya/core';
import { BoxRouteMiddleware } from '../routes/BoxRoutes';

export const register: BoxRouteMiddleware = async (ctx, next) => {
  // Extract box object from body
  const box: Box = ctx.request.body;

  // TODO: Validate box

  // Update box with registration info
  ctx.state.entity = await BasicModel.updateSingle(
    'box',
    { id: ctx.state.entity.id },
    { ...box, reg_mechanism: 'self-gen-key' }
  );

  await next();
};
