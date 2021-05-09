// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Handler for assignment related box routes

import { BoxRouteMiddleware } from '../routes/BoxRoutes';

export const getTaskAssignments: BoxRouteMiddleware = async (ctx, next) => {};

export const getMicrotasks: BoxRouteMiddleware = async (ctx, next) => {};

export const submitCompletedAssignments: BoxRouteMiddleware = async (ctx, next) => {};

export const getVerifiedAssignments: BoxRouteMiddleware = async (ctx, next) => {};
