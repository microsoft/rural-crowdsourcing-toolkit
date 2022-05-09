// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Controller to trigger materialized view updates

import { refreshAllMatViews } from '../models/MatViewModel';
import * as HttpResponse from '@karya/http-response';
import { BoxRouteMiddleware } from '../routes/BoxRoutes';

export const refreshMatViews: BoxRouteMiddleware = async (ctx) => {
  await refreshAllMatViews();
  HttpResponse.OK(ctx, {});
};
