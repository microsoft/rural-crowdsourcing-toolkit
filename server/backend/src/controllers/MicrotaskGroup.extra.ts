// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Implements APIs on 'microtask_group' that could not be auto generated

import { knex, MicrotaskGroup, MicrotaskGroupRecord, Task, TaskRecord, BasicModel } from '@karya/common';
import { getControllerError } from './ControllerErrors';
import * as HttpResponse from '@karya/http-response';
import { KaryaHTTPContext } from './KoaContextType';
import { getWorkProviderFilter } from './Task.extra';

/**
 * Controller to get a microtask group record by ID
 * @param ctx koa context
 * @param ctx.param.id ID of the microtask group
 */
export async function getRecordById(ctx: KaryaHTTPContext) {
  // extract ID from params
  const id = ctx.params.id;
  // extract the current user from state
  const { current_user } = ctx.state;

  try {
    // retrieve the record
    const microtaskGroupRecord = await BasicModel.getSingle('microtask_group', {
      id,
    });

    // check if work_provider has access to the record
    if (current_user.role != 'admin') {
      // extract task record for the microtask group
      const task = await BasicModel.getSingle('task', {
        id: microtaskGroupRecord.task_id,
      });

      // Access forbidden
      if (task.work_provider_id != current_user.id) {
        HttpResponse.NotFound(ctx, 'Requested record not found');
        return;
      }
    }
    // success
    HttpResponse.OK(ctx, microtaskGroupRecord);
  } catch (e) {
    const message = getControllerError(e);
    HttpResponse.NotFound(ctx, message);
  }
}

/**
 * Controller for microtask group records. Need to filter with work_provider ID
 * if not admin or if explicit filter is specified
 * @param ctx koa context
 */
export async function getRecords(ctx: KaryaHTTPContext) {
  try {
    // set the microtask group filter
    const microTaskGroupFilter: MicrotaskGroup = {};
    if (ctx.request.query.task_id) {
      microTaskGroupFilter.task_id = ctx.request.query.task_id as string;
    }

    // generate a work provider filter if necessary
    const workProviderFilter: Task = getWorkProviderFilter(ctx);

    let records: MicrotaskGroupRecord[] = [];

    // if there is a work provider filter
    if (workProviderFilter.work_provider_id) {
      records = await knex<MicrotaskGroupRecord>('microtask_group')
        .select()
        .where(microTaskGroupFilter)
        .whereIn('task_id', knex<TaskRecord>('task').select().where(workProviderFilter));
    } else {
      records = await BasicModel.getRecords('microtask_group', microTaskGroupFilter);
    }

    // send the records
    HttpResponse.OK(ctx, records);
  } catch (e) {
    const message = getControllerError(e);
    HttpResponse.GenericError(ctx, message);
  }
}
