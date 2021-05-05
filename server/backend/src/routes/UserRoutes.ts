// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// List of end points for the server user.

import { AuthMechanism, ServerUserRecord, UserRegistrationState } from '@karya/common';
import Application from 'koa';
import BodyParser from 'koa-body';
import Router from 'koa-router';

import * as Middlewares from '../user-routes-controllers/Middlewares';
import * as AuthController from '../user-routes-controllers/AuthController';
import * as ServerUserController from '../user-routes-controllers/ServerUserController';
import * as BoxController from '../user-routes-controllers/BoxController';
import * as TaskController from '../user-routes-controllers/TaskController';
import * as TaskAssignmentController from '../user-routes-controllers/TaskAssignmentController';

// Default state for all routes
export type KaryaDefaultUserRouteState = {
  auth_mechanism: AuthMechanism | null;
  entity: ServerUserRecord;
};

// Custom route state
type KaryaUserRouteState<ExtraState = {}> = KaryaDefaultUserRouteState & ExtraState;

// Default middleware type for all routes
export type KaryaUserRouteMiddleware<ExtraState = {}> = Application.Middleware<KaryaUserRouteState<ExtraState>>;

// Create the router
const userRouter = new Router<KaryaDefaultUserRouteState>({ prefix: '/api_user' });

/** Add user authenticator to all requests */
userRouter.use(Middlewares.authenticateRequest);

/**
 * Authentication related routes. Register, login and logout users.
 */
type RegistrationState = KaryaUserRouteState<UserRegistrationState<'server_user'>>;
export type RegistrationMiddleware = KaryaUserRouteMiddleware<UserRegistrationState<'server_user'>>;

// Register a user with google auth or phone otp mechanism. Returns an ID token
// back to the user. Need access code for identifying user record.
userRouter.put<RegistrationState, {}>(
  '/server_user/register',
  Middlewares.setRegMechanism,
  BodyParser(),
  AuthController.register,
  // @ts-ignore Possibly incorrect understanding of router types
  Middlewares.generateToken,
  Middlewares.respondWithUserRecord
);

// Exchange google auth or OTP for karya ID token. ID token is stored in cookies.
userRouter.get<RegistrationState, {}>(
  '/server_user/login',
  // @ts-ignore Possibly incorrect understanding of router types
  Middlewares.setRegMechanism,
  AuthController.login,
  Middlewares.generateToken,
  // @ts-ignore Possibly incorrect understanding of router types
  Middlewares.respondWithUserRecord
);

// Clear cookies = logout user.
userRouter.get('/server_user/logout', AuthController.logout);

/**
 * Server user routes. Create/update server user
 */

// Create a new server user
userRouter.post(
  '/server_users',
  Middlewares.needIdToken,
  Middlewares.onlyAdmin,
  BodyParser(),
  ServerUserController.create
);

// Get all server users
userRouter.get('/server_users', Middlewares.needIdToken, Middlewares.onlyAdmin, ServerUserController.getAll);

// Get current server_user
userRouter.get('/server_user', Middlewares.needIdToken, Middlewares.respondWithUserRecord);

/**
 * Routes to create, get, remove boxes.
 */

// Create a new box with a given name. Generates a random access code for the box.
userRouter.post('/boxes', Middlewares.needIdToken, Middlewares.onlyAdmin, BodyParser(), BoxController.create);

// Get all boxes
userRouter.get('/boxes', Middlewares.needIdToken, Middlewares.onlyAdmin, BoxController.getAll);

/**
 * Task related routes. Create/update tasks, submit input files.
 */

// Create a new task
userRouter.post('/tasks', Middlewares.needIdToken, BodyParser(), TaskController.create);

// TODO: Edit task
// userRouter.put('/task/:id');

// Submit input files for a task
userRouter.post(
  '/task/:id/input_files',
  Middlewares.needIdToken,
  BodyParser({ multipart: true }),
  TaskController.submitInputFiles
);

// Get all tasks
userRouter.get('/tasks', Middlewares.needIdToken, TaskController.getAll);

/**
 * Task assignment routes. Create/update task assignments
 */

// Create task assignment
userRouter.post(
  '/task_assignments',
  Middlewares.needIdToken,
  Middlewares.onlyAdmin,
  BodyParser(),
  TaskAssignmentController.create
);

// Get all task assignments
userRouter.get('/task_assignments', Middlewares.needIdToken, Middlewares.onlyAdmin, TaskAssignmentController.get);

export { userRouter };
