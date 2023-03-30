// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Defines the koa context state type to be used by the koa app and router.

import { WorkerRecord } from '@karya/core';
import { AuthState } from '@karya/common';
import Application, { ParameterizedContext } from 'koa';

// Default koa state for box server requests
export type KaryaDefaultState = AuthState & {
  entity: WorkerRecord;
};

// Template for extra route state
export type KaryaRouteState<ExtraState = {}> = KaryaDefaultState & ExtraState;

// Koa context type
export type KaryaContext<ExtraState = {}> = ParameterizedContext<KaryaRouteState<ExtraState>>;

// Koa middleware type
export type KaryaMiddleware<ExtraState = {}> = Application.Middleware<KaryaRouteState<ExtraState>>;
