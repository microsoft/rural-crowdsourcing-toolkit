// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Handler for task related routes

import { KaryaUserRouteMiddleware } from '../routes/UserRoutes';

/**
 * Create a new task.
 */
export const create: KaryaUserRouteMiddleware = async (ctx) => {};

/**
 * Submit input files for a task
 */
export const submitInputFiles: KaryaUserRouteMiddleware = async (ctx) => {};

/**
 * Get all tasks.
 */
export const get: KaryaUserRouteMiddleware = async (ctx) => {};
