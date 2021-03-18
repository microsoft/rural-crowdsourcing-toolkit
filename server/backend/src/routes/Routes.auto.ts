// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * This file was auto-generated using specs and scripts in the db-schema
 * repository. DO NOT EDIT DIRECTLY.
 */

import BodyParser from 'koa-body';
import Router from 'koa-router';

import { checkAdmin, setGetFilter, setTableName } from './Middlewares';

import { getRecordById, getRecords, insertRecord, updateRecordById } from '../controllers/BasicController';

import * as AuthController from '../controllers/Auth.extra';
import * as BoxController from '../controllers/Box.extra';
import * as LanguageController from '../controllers/Language.extra';
import * as LanguageResourceValueController from '../controllers/LanguageResourceValue.extra';
import * as MicrotaskController from '../controllers/Microtask.extra';
import * as MicrotaskAssignmentController from '../controllers/MicrotaskAssignment.extra';
import * as MicrotaskGroupController from '../controllers/MicrotaskGroup.extra';
import * as PaymentRequestController from '../controllers/PaymentRequest.extra';
import * as TaskController from '../controllers/Task.extra';
import * as WorkProviderController from '../controllers/WorkProvider.extra';

// create a new router
const router = new Router({ prefix: '/api' });

router.put('/language/:id/updated_support', checkAdmin, BodyParser(), LanguageController.updateSupported);
router.post('/language', checkAdmin, setTableName, BodyParser(), insertRecord);
router.put('/language/:id', checkAdmin, setTableName, BodyParser(), updateRecordById);
router.get('/language/:id', setTableName, getRecordById);
router.get('/language', setTableName, setGetFilter, getRecords);

router.get('/scenario/:id', setTableName, getRecordById);
router.get('/scenario', setTableName, setGetFilter, getRecords);

router.post('/language_resource', checkAdmin, setTableName, BodyParser(), insertRecord);
router.put('/language_resource/:id', checkAdmin, setTableName, BodyParser(), updateRecordById);
router.get('/language_resource/:id', checkAdmin, setTableName, getRecordById);
router.get('/language_resource', checkAdmin, setTableName, setGetFilter, getRecords);

router.get('/language_resource_value', checkAdmin, LanguageResourceValueController.getRecords);
router.post('/file_language_resource_value/', checkAdmin, BodyParser({ multipart: true }), LanguageResourceValueController.createFileResourceValue);
router.put('/file_language_resource_value/:id/', checkAdmin, BodyParser({ multipart: true }), LanguageResourceValueController.updateFileResourceValue);
router.post('/language_resource_value', checkAdmin, setTableName, BodyParser(), insertRecord);
router.put('/language_resource_value/:id', checkAdmin, setTableName, BodyParser(), updateRecordById);
router.get('/language_resource_value/:id', checkAdmin, setTableName, getRecordById);

router.get('/work_provider/:id', WorkProviderController.getRecordById);
router.put('/work_provider/:id', BodyParser(), WorkProviderController.updateRecordById);
router.post('/work_provider/generate/cc', checkAdmin, BodyParser(), WorkProviderController.generateCreationCode);
router.get('/work_provider', checkAdmin, setTableName, setGetFilter, getRecords);

router.put('/work_provider/update/cc', BodyParser(), AuthController.updateWithCreationCode);
router.post('/work_provider/sign/in', BodyParser(), AuthController.signIn);
router.post('/work_provider/sign/in', BodyParser(), AuthController.signIn);
router.put('/work_provider/sign/out', BodyParser(), AuthController.signOut);

router.post('/box/generate/cc', checkAdmin, BodyParser(), BoxController.generateCreationCode);
router.put('/box/:id', checkAdmin, setTableName, BodyParser(), updateRecordById);
router.get('/box/:id', checkAdmin, setTableName, getRecordById);
router.get('/box', checkAdmin, setTableName, setGetFilter, getRecords);

router.put('/worker/:id', checkAdmin, setTableName, BodyParser(), updateRecordById);
router.get('/worker/:id', checkAdmin, setTableName, getRecordById);
router.get('/worker', checkAdmin, setTableName, setGetFilter, getRecords);

router.post('/karya_file', checkAdmin, setTableName, BodyParser(), insertRecord);
router.put('/karya_file/:id', checkAdmin, setTableName, BodyParser(), updateRecordById);
router.get('/karya_file/:id', checkAdmin, setTableName, getRecordById);
router.get('/karya_file', checkAdmin, setTableName, setGetFilter, getRecords);

router.post('/task', BodyParser({ multipart: true }), TaskController.insertRecord);
router.get('/task/:id', TaskController.getRecordById);
router.put('/task/:id', BodyParser({ multipart: true }), TaskController.updateRecordById);
router.get('/task', TaskController.getRecords);
router.put('/task/:id/validate', BodyParser(), TaskController.validateTask);
router.put('/task/:id/approve', checkAdmin, BodyParser(), TaskController.approveTask);

router.get('/microtask_group/:id', MicrotaskGroupController.getRecordById);
router.get('/microtask_group', MicrotaskGroupController.getRecords);

router.get('/microtask/:id', MicrotaskController.getRecordById);
router.get('/microtask', MicrotaskController.getRecords);
router.get('/microtasks_with_completed_assignments/', checkAdmin, MicrotaskController.getMicrotasksWithCompletedAssignments);

router.get('/policy/:id', checkAdmin, setTableName, getRecordById);
router.get('/policy', checkAdmin, setTableName, setGetFilter, getRecords);

router.post('/task_assignment', checkAdmin, setTableName, BodyParser(), insertRecord);
router.put('/task_assignment/:id', checkAdmin, setTableName, BodyParser(), updateRecordById);
router.get('/task_assignment/:id', checkAdmin, setTableName, getRecordById);
router.get('/task_assignment', checkAdmin, setTableName, setGetFilter, getRecords);

router.put('/worker_language_skill/:id', checkAdmin, setTableName, BodyParser(), updateRecordById);
router.get('/worker_language_skill/:id', checkAdmin, setTableName, getRecordById);
router.get('/worker_language_skill', checkAdmin, setTableName, setGetFilter, getRecords);

router.put('/microtask_group_assignment/:id', checkAdmin, setTableName, BodyParser(), updateRecordById);
router.get('/microtask_group_assignment/:id', checkAdmin, setTableName, getRecordById);
router.get('/microtask_group_assignment', checkAdmin, setTableName, setGetFilter, getRecords);

router.get('/microtask_assignment', checkAdmin, MicrotaskAssignmentController.getRecords);
router.put('/microtask_assignment/:id', checkAdmin, setTableName, BodyParser(), updateRecordById);
router.get('/microtask_assignment/:id', checkAdmin, setTableName, getRecordById);

router.get('/payout_method/:id', checkAdmin, setTableName, getRecordById);
router.get('/payout_method', checkAdmin, setTableName, setGetFilter, getRecords);

router.put('/payout_info/:id', checkAdmin, setTableName, BodyParser(), updateRecordById);
router.get('/payout_info/:id', checkAdmin, setTableName, getRecordById);
router.get('/payout_info', checkAdmin, setTableName, setGetFilter, getRecords);

router.get('/payment_request', checkAdmin, PaymentRequestController.getRecords);
router.put('/payment_request/:id', checkAdmin, setTableName, BodyParser(), updateRecordById);
router.get('/payment_request/:id', checkAdmin, setTableName, getRecordById);

export default router;
