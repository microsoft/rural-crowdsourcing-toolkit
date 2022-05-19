// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// List of end points for the server user.

import { AuthMechanism, ServerUserRecord } from '@karya/core';
import Application from 'koa';
import BodyParser from 'koa-body';
import Router from 'koa-router';

import * as Middlewares from '../user-routes-controllers/Middlewares';
import * as AuthController from '../user-routes-controllers/AuthController';
import * as ServerUserController from '../user-routes-controllers/ServerUserController';
import * as BoxController from '../user-routes-controllers/BoxController';
import * as TaskController from '../user-routes-controllers/TaskController';
import * as TaskAssignmentController from '../user-routes-controllers/TaskAssignmentController';
import * as TaskLinkController from '../user-routes-controllers/TaskLinkController';
import * as WorkerController from '../user-routes-controllers/WorkerController';
import * as LanguageController from '../user-routes-controllers/LanguageController';
import { tokenAuthoriser } from '../utils/auth/tokenAuthoriser/Index';

// Default state for all routes
export type DefaultUserRouteState = {
  auth_mechanism: AuthMechanism | null;
  entity: ServerUserRecord;
};

// Custom route state
export type UserRouteState<ExtraState = {}> = DefaultUserRouteState & ExtraState;

// Default middleware type for all routes
export type UserRouteMiddleware<ExtraState = {}> = Application.Middleware<UserRouteState<ExtraState>>;

// Create the router
const userRouter = new Router<DefaultUserRouteState>();

/** Add user authenticator to all requests */
userRouter.use(Middlewares.authenticateRequest);

/**
 * Authentication related routes. Register, login and logout users.
 */

// Register a user with google auth or phone otp mechanism. Returns an ID token
// back to the user. Need access code for identifying user record.
userRouter.put<AuthController.RegistrationState, {}>(
  'REGISTER_SERVER_USER',
  '/server_user/register',
  AuthController.setRegMechanism,
  BodyParser(),
  // @ts-ignore Possibly incorrect understanding of router types
  AuthController.register,
  Middlewares.generateToken,
  Middlewares.respondWithUserRecord
);

// Exchange google auth or OTP for karya ID token. ID token is stored in cookies.
userRouter.get<AuthController.RegistrationState, {}>(
  'LOGIN_SERVER_USER',
  '/server_user/login',
  AuthController.setRegMechanism,
  AuthController.login,
  // @ts-ignore Possibly incorrect understanding of router types
  Middlewares.generateToken,
  Middlewares.respondWithUserRecord
);

// Clear cookies = logout user.
userRouter.get('LOGOUT_SERVER_USER', '/server_user/logout', AuthController.logout);

/**
 * Server user routes. Create/update server user
 */

// Create a new server user
userRouter.post(
  'CREATE_SERVER_USERS',
  '/server_users',
  Middlewares.needIdToken,
  Middlewares.onlyAdmin,
  BodyParser(),
  ServerUserController.create
);

// Get all server users
userRouter.get(
  'GET_ALL_SERVER_USERS',
  '/server_users',
  Middlewares.needIdToken,
  Middlewares.onlyAdmin,
  ServerUserController.getAll
);

// Get current server_user
userRouter.get('GET_CURRENT_SERVER_USER', '/server_user', Middlewares.needIdToken, Middlewares.respondWithUserRecord);

/**
 * Routes to create, get, remove boxes.
 */

// Create a new box with a given name. Generates a random access code for the box.
userRouter.post(
  'CREATE_BOX',
  '/boxes',
  Middlewares.needIdToken,
  Middlewares.onlyAdmin,
  BodyParser(),
  BoxController.create
);

// Get all boxes
userRouter.get('GET_ALL_BOXES', '/boxes', Middlewares.needIdToken, Middlewares.onlyAdmin, BoxController.getAll);

/**
 * Task related routes. Create/update tasks, submit input files.
 */

// Create a new task
userRouter.post('CREATE_TASK', '/tasks', Middlewares.needIdToken, tokenAuthoriser, BodyParser(), TaskController.create);

// Edit task
userRouter.put(
  'EDIT_TASK',
  '/task/:id',
  Middlewares.needIdToken,
  tokenAuthoriser,
  BodyParser(),
  TaskController.editTask
);

// Submit input files for a task
userRouter.post<TaskController.TaskRouteState, {}>(
  'SUBMIT_TASK_INPUT_FILE',
  '/task/:id/input_files',
  Middlewares.needIdToken,
  tokenAuthoriser,
  // @ts-ignore
  TaskController.checkTask,
  BodyParser({ multipart: true }),
  TaskController.submitInputFiles
);

// Get input and output files of a task
userRouter.get<TaskController.TaskRouteState, {}>(
  'GET_TASK_IO_FILES',
  '/task/:id/input_files',
  Middlewares.needIdToken,
  tokenAuthoriser,
  // @ts-ignore
  TaskController.checkTask,
  TaskController.getFiles
);

// Get all tasks
userRouter.get('GET_ALL_TASKS', '/tasks', Middlewares.needIdToken, TaskController.getAll);

// Trigger output file creation
userRouter.post<TaskController.TaskRouteState, {}>(
  'CREATE_OUTPUT_FILE',
  '/task/:id/output_file',
  Middlewares.needIdToken,
  tokenAuthoriser,
  // @ts-ignore
  TaskController.checkTask,
  TaskController.generateOutput
);

// Get microtask level summary of a task
userRouter.get<TaskController.TaskRouteState, {}>(
  'GET_MICROTASK_SUMMARY_OF_TASK',
  '/task/:id/microtask_summary',
  Middlewares.needIdToken,
  TaskController.checkTask,
  // @ts-ignore
  TaskController.getMicrotasksSummary
);

// Get summary for each and every task
userRouter.get<TaskController.TaskRouteState, {}>(
  'GET_SUMMARY_OF_EVERY_TASK',
  '/task/summary',
  // @ts-ignore
  Middlewares.needIdToken,
  TaskController.getTasksSummary
);

// Mark a task complete
userRouter.put<TaskController.TaskRouteState, {}>(
  'MARK_TASK_COMPLETE',
  '/task/:id/mark_complete',
  Middlewares.needIdToken,
  tokenAuthoriser,
  // @ts-ignores
  TaskController.checkTask,
  TaskController.markComplete
);

/**
 * Task assignment routes. Create/update task assignments
 */

// Create task assignment
userRouter.post(
  'CREATE_TASK_ASSIGNMENT',
  '/task_assignments',
  Middlewares.needIdToken,
  Middlewares.onlyAdmin,
  BodyParser(),
  TaskAssignmentController.create
);

// Edit task assignment
userRouter.put(
  'EDIT_TASK_ASSIGNMENT',
  '/task_assignment/:id',
  Middlewares.needIdToken,
  Middlewares.onlyAdmin,
  BodyParser(),
  TaskAssignmentController.edit
);

// Get all task assignments
userRouter.get(
  'GET_ALL_TASK_ASSIGNMENTS',
  '/task_assignments',
  Middlewares.needIdToken,
  Middlewares.onlyAdmin,
  TaskAssignmentController.get
);

/**
 * Task link related routes. Create, get task links
 */

// Create task link
userRouter.post<TaskController.TaskRouteState, {}>(
  'CREATE_TASK_LINK',
  '/task/:id/task_links',
  Middlewares.needIdToken,
  tokenAuthoriser,
  // @ts-ignore
  TaskController.checkTask,
  BodyParser(),
  TaskLinkController.create
);

// Get all task links
userRouter.get<TaskController.TaskRouteState, {}>(
  'GET_ALL_TASK_LINKS',
  '/task/:id/task_links',
  Middlewares.needIdToken,
  tokenAuthoriser,
  // @ts-ignore
  TaskController.checkTask,
  TaskLinkController.get
);

/**
 * Worker related routes. Get summary info
 */

// Get summary for each and every worker
userRouter.get<WorkerController.WorkerRouteState, {}>(
  'GET_WORKER_SUMMARY',
  '/worker/summary',
  // @ts-ignore
  Middlewares.needIdToken,
  WorkerController.getWorkersSummary
);

// Get summary of workers for a particular task
userRouter.get<TaskController.TaskRouteState, {}>(
  'GET_WORKERS_SUMMARY_FOR_TASK',
  '/task/:id/worker_summary',
  Middlewares.needIdToken,
  TaskController.checkTask,
  // @ts-ignore
  TaskController.getWorkersTaskSummary
);

// Disable a worker
userRouter.put<WorkerController.WorkerRouteState, {}>(
  'DISABLE_WORKER',
  '/worker/:id/disable',
  Middlewares.needIdToken,
  Middlewares.onlyAdmin,
  // @ts-ignore
  WorkerController.markDisabled
);

// Generate new workers
userRouter.post<WorkerController.WorkerRouteState, {}>(
  'GENERATE_WORKERS',
  '/workers',
  Middlewares.needIdToken,
  Middlewares.onlyAdmin,
  // @ts-ignore
  BodyParser(),
  WorkerController.generateNewWorkers
);

/**
 * Language asset related routes. Submit, get language assets
 */

// Submit language assets
userRouter.post(
  'SUBMIT_LANGUAGE_ASSETS',
  '/lang-assets/:code',
  Middlewares.needIdToken,
  tokenAuthoriser,
  BodyParser({ multipart: true }),
  // @ts-ignore
  LanguageController.submitLangAsset
);

// Get all language asset files
userRouter.get(
  'GET_LANGUAGE_ASSETS',
  '/lang-assets',
  // @ts-ignore
  Middlewares.needIdToken,
  LanguageController.getLangAssets
);

export { userRouter };
