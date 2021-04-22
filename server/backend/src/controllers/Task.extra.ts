// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Implements APIs for the 'task' table. These endpoints can be accessed by a
// regular work provider, but need additional filters to ensure that a work
// provider can only access tasks that they have created. Hence, they could not
// be auto generated.

import { Task, TaskRecord, BasicModel } from '@karya/db';
import { getControllerError } from './ControllerErrors';
import * as BlobStore from '@karya/blobstore';
import * as HttpResponse from '@karya/http-response';
import { KaryaHTTPContext } from './KoaContextType';
import { validateTaskParameters } from '@karya/scenarios';

/**
 * Function to create a work provider filter either based on an explicit query
 * parameter (only admin) or implicitly based on the work provider ID
 * (non-admin)
 * @param ctx koa context
 * @param ctx.request.query.work_provider_id explicit work provider filter
 * @param ctx.state.workProvider.id implicit work provider ID
 */
export function getWorkProviderFilter(ctx: KaryaHTTPContext): Task {
  const workProviderFilter: Task = {};

  // get current user
  const { current_user } = ctx.state;

  // first set the explicit ID if it is provided
  if (ctx.request.query.work_provider_id) {
    workProviderFilter.work_provider_id = ctx.request.query.work_provider_id as string;
  }
  // if not admin, override with the implicit ID
  if (!current_user.admin) {
    workProviderFilter.work_provider_id = current_user.id;
  }
  return workProviderFilter;
}

/**
 * Generate output SAS URLs for tasks
 */
export function generateOutputSasURLs(task: TaskRecord): TaskRecord {
  const params = task.params as {
    outputFiles: Array<[string, string, string | null]>;
  };
  if (params.outputFiles) {
    for (const f of params.outputFiles) {
      if (f[2]) {
        f[2] = BlobStore.getBlobSASURL(f[2], 'r', 60);
      }
    }
  }
  return { ...task, params };
}

/**
 * Controller to insert a new task record.
 * @param ctx koa context
 * @param ctx.request.body.data Task object to be inserted
 * @param ctx.request.files Any file parameter uploaded via this interface
 */
export async function insertRecord(ctx: KaryaHTTPContext) {
  try {
    // extract the task object and file attachments
    const task: Task = ctx.request.body;

    // get current user from state
    const { current_user } = ctx.state;

    // force work provider ID to be the ID of the current work provider
    task.work_provider_id = current_user.id;

    let params: object;
    try {
      params = await validateTaskParameters(task);
    } catch (e) {
      HttpResponse.BadRequest(ctx, e.message);
      return;
    }

    task.params = params;
    task.status = 'validated';

    // Insert the task into the Db
    const insertedRecord = await BasicModel.insertRecord('task', task);
    HttpResponse.OK(ctx, insertedRecord);
  } catch (e) {
    const message = getControllerError(e);
    HttpResponse.BadRequest(ctx, message);
  }
}

/**
 * Controller to update an existing task record by ID. If not admin, need to
 * check for permissions
 * @param ctx koa context
 * @param ctx.params.id ID of the task to be updated
 * @param ctx.request.body Object containing the updates
 */
export async function updateRecordById(ctx: KaryaHTTPContext) {
  /** TODO: This funciton needs to be fixed
   * 1. File upload needs to happen via the other channel
   * 2. The update record may not contain all the parameters
   */
  // get current user
  try {
    // run validating task utility in background
    // runService('validate_task', { task, scenario });
  } catch (e) {
    const message = getControllerError(e);
    HttpResponse.GenericError(ctx, message);
  }
}

/**
 * Controller to get a record by ID. Need to filter by work_provider_id if
 * necessary.
 * @param ctx koa context
 * @param ctx.params.id ID of the task
 */
export async function getRecordById(ctx: KaryaHTTPContext) {
  // extract id from the params
  const id = ctx.params.id;

  // get the current user from state
  const { current_user } = ctx.state;

  // create the ID filger
  const filter: Task = { id };

  // add the work_provider field if not admin
  if (!current_user.admin) {
    filter.work_provider_id = current_user.id;
  }

  try {
    // retrieve the record
    const record = await BasicModel.getSingle('task', filter);
    HttpResponse.OK(ctx, generateOutputSasURLs(record));
  } catch (e) {
    const message = getControllerError(e);
    HttpResponse.NotFound(ctx, message);
  }
}

/**
 * Controller to get all the tasks. Need to filter by work_provider_id if not
 * admin.
 * @param ctx koa context
 */
export async function getRecords(ctx: KaryaHTTPContext) {
  // generate the work provider filter
  const workProviderFilter: Task = getWorkProviderFilter(ctx);

  try {
    // retrieve the records
    const records = await BasicModel.getRecords('task', workProviderFilter);
    const recordsWithSAS = records.map((t) => generateOutputSasURLs(t));
    HttpResponse.OK(ctx, recordsWithSAS);
  } catch (e) {
    const message = getControllerError(e);
    HttpResponse.GenericError(ctx, message);
  }
}
