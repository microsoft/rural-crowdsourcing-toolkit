// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// This file implements the list of endpoints for the box server. The
// OpenAPI specification for this server can be found at api/box-server-api.yaml
// in the root of this repository.

import Router from 'koa-router';
import BodyParser from 'koa-body';
import { KaryaDefaultState } from '../KoaContextState';
import { needIdToken } from '../controllers/Middlewares';

import * as WorkerController from '../controllers/WorkerController';
import * as KaryaFileController from '../controllers/KaryaFileController';
import * as AssignmentController from '../controllers/AssignmentController';
import { KaryaIDTokenHandlerTemplate, KaryaIDTokenState } from '@karya/common';
import { OTPHandlerTemplate, OTPState, OTPRateLimiter } from '@karya/common';

// Karya ID token handlers and type
export const { generateToken, authenticateRequest } = KaryaIDTokenHandlerTemplate('worker');
export type WorkerIdTokenState = KaryaIDTokenState<'worker'>;

// OTP handler and type
const OTPHandler = OTPHandlerTemplate('worker');
type WorkerOTPState = OTPState<'worker'>;

// Initializing rate limiter
const resendOTPRateLimiter = new OTPRateLimiter<'worker'>(3);
const generateOTPRateLimiter = new OTPRateLimiter<'worker'>(3);

// Router
const router = new Router<KaryaDefaultState>();

// Worker get and update routes
router.get('/worker', WorkerController.get);
router.put('/worker', needIdToken, BodyParser(), WorkerController.update);

// OTP routes
// @ts-ignore
router.put<WorkerOTPState, {}>('/worker/otp/generate', OTPHandler.checkPhoneNumber, generateOTPRateLimiter.limiter, OTPHandler.generate);
// @ts-ignore
router.put<WorkerOTPState, {}>('/worker/otp/resend', OTPHandler.checkPhoneNumber,resendOTPRateLimiter.limiter, OTPHandler.resend);
router.put<WorkerOTPState, {}>(
  '/worker/otp/verify',
  OTPHandler.checkPhoneNumber,
  OTPHandler.verify,
  generateToken,
  // @ts-ignore Incorrect route typing. Need to fix
  WorkerController.registerWorker
);

// Karya file get routes
router.get<KaryaFileController.KaryaFileGetRouteState, {}>(
  '/language_assets/:code',
  KaryaFileController.checkLanguageAssets,
  KaryaFileController.getFile
);
router.get<KaryaFileController.KaryaFileGetRouteState, {}>(
  '/assignment/:id/input_file',
  // @ts-ignore Possibly incorrect typing in koa
  needIdToken,
  KaryaFileController.checkMicrotaskInputFile,
  KaryaFileController.getFile
);

// Karya file create routes
router.post<KaryaFileController.KaryaFileSubmitRouteState, {}>(
  '/assignment/:id/output_file',
  needIdToken,
  BodyParser({ multipart: true }),
  KaryaFileController.verifyFile,
  // @ts-ignore Possibly incorrect typing by koa
  KaryaFileController.submitOutputFile,
  KaryaFileController.submitFile
);
router.post<KaryaFileController.KaryaFileSubmitRouteState, {}>(
  '/worker/log_file',
  needIdToken,
  BodyParser({ multipart: true }),
  KaryaFileController.verifyFile,
  // @ts-ignore Possibly incorrect typing by koa
  KaryaFileController.submitLogFile,
  KaryaFileController.submitFile
);

// Assignment routes
router.put('/assignments', needIdToken, BodyParser({ jsonLimit: '20mb' }), AssignmentController.submit);
router.put('/skipped_assignments', needIdToken, BodyParser({ jsonLimit: '20mb' }), AssignmentController.submitSkipped);
router.get('/assignments', needIdToken, AssignmentController.get);

// Token Routes
router.get('/renew_id_token', needIdToken, generateToken, WorkerController.sendGeneratedIdToken)

export default router;
