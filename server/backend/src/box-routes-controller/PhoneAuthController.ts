// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Handler for sending phone authentication information

import { BoxRouteMiddleware } from '../routes/BoxRoutes';
import { getOTPConfig } from '@karya/common';
import * as HttpResponse from '@karya/http-response';

export const getPhoneAuthInfo: BoxRouteMiddleware = async (ctx) => {
  try {
    HttpResponse.OK(ctx, getOTPConfig());
  } catch (e) {
    HttpResponse.Unavailable(ctx, 'Phone otp service is not available');
    return;
  }
};
