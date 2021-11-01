// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// List of end points for the server user.

import { AuthMechanism, BoxRecord } from '@karya/core';
import Application from 'koa';
import BodyParser from 'koa-body';
import Router from 'koa-router';

import * as Middlewares from '../box-routes-controller/Middlewares';
import * as AuthController from '../box-routes-controller/AuthController';
import * as KaryaFileController from '../box-routes-controller/KaryaFileController';
import { getPhoneAuthInfo } from '../box-routes-controller/PhoneAuthController';
import * as WorkerController from '../box-routes-controller/WorkerController';
import * as TaskController from '../box-routes-controller/TaskController';

// Default state for all routes
export type DefaultBoxRouteState = {
  auth_mechanism: AuthMechanism | null;
  entity: BoxRecord;
};

// Custom route state
export type BoxRouteState<ExtraState = {}> = DefaultBoxRouteState & ExtraState;
// Middleware for all routes
export type BoxRouteMiddleware<ExtraState = {}> = Application.Middleware<BoxRouteState<ExtraState>>;

// Create the router
export const boxRouter = new Router<DefaultBoxRouteState>();

// Authenticate all requests
boxRouter.use(Middlewares.authenticateRequest);

// Register a box with the server
boxRouter.put(
  '/register',
  BodyParser(),
  AuthController.register,
  Middlewares.generateToken,
  Middlewares.respondWithBoxRecord
);

// Renew id token (also serves as a check-in mechanism)
boxRouter.get('/renew-token', Middlewares.needIdToken, Middlewares.generateToken, Middlewares.respondWithBoxRecord);

// Get phone authentication on information
boxRouter.get('/phone-auth', Middlewares.needIdToken, getPhoneAuthInfo);

// Upload file to the server
boxRouter.put('/karya_file', Middlewares.needIdToken, BodyParser({ multipart: true }), KaryaFileController.upload);

// Get read SAS token for karya file
boxRouter.get('/karya_file/:id', Middlewares.needIdToken, KaryaFileController.get);

// Get language assets
boxRouter.get('/language_assets', Middlewares.needIdToken, KaryaFileController.getLanguageAssets);

// Send all newly created workers
boxRouter.put('/new_workers', Middlewares.needIdToken, BodyParser({ jsonLimit: '50mb' }), WorkerController.newWorkers);

// Send all updated workers
boxRouter.put('/workers', Middlewares.needIdToken, BodyParser({ jsonLimit: '50mb' }), WorkerController.updateWorkers);

// Get all udpated workers
boxRouter.get('/workers', Middlewares.needIdToken, WorkerController.get);

// Get new task assignments
boxRouter.get('/task_assignments', Middlewares.needIdToken, TaskController.getTaskAssignments);

// Get new microtasks (and correspond groups/files) for the specified task
boxRouter.get<TaskController.TaskRouteState, {}>(
  '/task/:id/microtasks',
  // @ts-ignore Lack of full understanding of router types
  Middlewares.needIdToken,
  TaskController.setTask,
  TaskController.getMicrotasks
);

// Submit completed assignments for the specified task
boxRouter.put<TaskController.TaskRouteState, {}>(
  '/task/:id/new_assignments',
  Middlewares.needIdToken,
  TaskController.setTask,
  BodyParser({ jsonLimit: '20mb' }),
  // @ts-ignore Lack of full understanding of router types
  TaskController.submitNewAssignments
);

// Submit completed assignments for the specified task
boxRouter.put<TaskController.TaskRouteState, {}>(
  '/task/:id/completed_assignments',
  Middlewares.needIdToken,
  TaskController.setTask,
  BodyParser({ jsonLimit: '20mb' }),
  // @ts-ignore Lack of full understanding of router types
  TaskController.submitCompletedAssignments
);

boxRouter.post<TaskController.TaskRouteState, {}>(
  '/task/:id/links',
  // @ts-ignore
  Middlewares.needIdToken,
  TaskController.setTask,
  TaskController.executeTaskLinks
);

// Get verified assignments for the specified task
boxRouter.get<TaskController.TaskRouteState, {}>(
  '/task/:id/verified_assignments',
  // @ts-ignore Lack of full understanding of router types
  Middlewares.needIdToken,
  TaskController.setTask,
  TaskController.getVerifiedAssignments
);
