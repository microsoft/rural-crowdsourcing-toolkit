// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// This file defines a basic set of controllers that can be used by all the
// tables in the database.

import { getControllerError } from '../errors/ControllerErrors';
import { BasicModel } from '@karya/db';
import * as HttpResponse from '@karya/http-response';
import { KaryaHTTPContext } from './KoaContextType';

/**
 * Controller to insert a new record into a table. The table name is expected to
 * be set by the setTableName middleware. The corresponding table object is
 * extracted from the request body.
 * @param ctx koa request context
 */
export async function insertRecord(ctx: KaryaHTTPContext) {
  // extract tablename and record  from context
  const tableName = ctx.state.tableName;
  const record = ctx.request.body;

  try {
    // insert record and return response
    const insertedRecord = await BasicModel.insertRecord(tableName, record);
    HttpResponse.OK(ctx, insertedRecord);
  } catch (e) {
    const message = getControllerError(e);
    HttpResponse.BadRequest(ctx, message);
  }
}

/**
 * Controller to update a record using its ID. The table name is expected to be
 * set by the setTableName middleware. The ID is provided as a path parameter.
 * The object containing the updates is extracted from the request body.
 * @param ctx koa request context
 */
export async function updateRecordById(ctx: KaryaHTTPContext) {
  // extract table name, ID, and updates from context
  const tableName = ctx.state.tableName;
  const id = ctx.params.id;
  const updates = ctx.request.body;

  // the match object is just the ID
  const match = { id };

  try {
    // update record and return response
    const updatedRecord = await BasicModel.updateSingle(tableName, match, updates);
    HttpResponse.OK(ctx, updatedRecord);
  } catch (e) {
    const message = getControllerError(e);
    HttpResponse.BadRequest(ctx, message);
  }
}

/**
 * Function to retrieve a record using its ID. The table name is expected to be
 * set by the setTableName middleware. The ID is provided as a path parameter.
 * @param ctx koa request context
 */
export async function getRecordById(ctx: KaryaHTTPContext) {
  // extract table name and ID from the context
  const tableName = ctx.state.tableName;
  const id = ctx.params.id;

  // the match object is just the ID
  const match = { id };

  try {
    // retrive record and return response
    const record = await BasicModel.getSingle(tableName, match);
    HttpResponse.OK(ctx, record);
  } catch (e) {
    const message = getControllerError(e);
    HttpResponse.NotFound(ctx, message);
  }
}

/**
 * Controller to retrieve all records from a table with possible filters. The
 * table name is expected to be set by the setTableName middleware. The filter
 * from the query string is expected to be set by the setGetFilter middleware.
 * @param ctx koa request context
 */
export async function getRecords(ctx: KaryaHTTPContext) {
  // extract table name and get filter from the context
  const tableName = ctx.state.tableName;
  const filter = ctx.state.filter;

  try {
    // get the records
    const records = await BasicModel.getRecords(tableName, filter);
    HttpResponse.OK(ctx, records);
  } catch (e) {
    const message = getControllerError(e);
    HttpResponse.GenericError(ctx, message);
  }
}
