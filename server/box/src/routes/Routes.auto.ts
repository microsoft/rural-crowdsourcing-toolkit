/**
 * This file was auto-generated using specs and scripts in the db-schema
 * repository. DO NOT EDIT DIRECTLY.
 */

import * as BodyParser from 'koa-body';
import * as Router from 'koa-router';

import { setGetFilter, setTableName } from './Middlewares';

import { getRecordById, getRecords, insertRecord, updateRecordById } from '../controllers/BasicController';

// create a new router
const router = new Router();

router.get('/language/:id', setTableName, getRecordById);
router.get('/language/', setTableName, setGetFilter, getRecords);

router.get('/scenario/', setTableName, setGetFilter, getRecords);

router.get('/language_resource/', setTableName, setGetFilter, getRecords);
router.get('/language_resource/:id', setTableName, getRecordById);

router.get('/language_resource_value/', setTableName, setGetFilter, getRecords);
router.get('/language_resource_value/:id', setTableName, getRecordById);

router.get('/worker_language_skill/:id', setTableName, getRecordById);
router.get('/worker_language_skill/', setTableName, setGetFilter, getRecords);
router.put('/worker_language_skill/:id', setTableName, BodyParser(), updateRecordById);

router.get('/payout_method/:id', setTableName, getRecordById);
router.get('/payout_method/', setTableName, setGetFilter, getRecords);

router.get('/payout_info/:id', setTableName, getRecordById);
router.get('/payout_info/', setTableName, setGetFilter, getRecords);
router.post('/payout_info/', setTableName, BodyParser(), insertRecord);
router.put('/payout_info/:id', setTableName, BodyParser(), updateRecordById);

router.get('/payment_request/:id', setTableName, getRecordById);
router.get('/payment_request/', setTableName, setGetFilter, getRecords);
router.post('/payment_request/', setTableName, BodyParser(), insertRecord);
router.put('/payment_request/:id', setTableName, BodyParser(), updateRecordById);

export default router;
