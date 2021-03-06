// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Implements APIs on 'microtask_group' that could not be auto generated

import { knex } from '../db/Client';
import { tableFilterColumns } from '../db/TableFilterColumns.auto';
import {
  Microtask,
  MicrotaskAssignmentRecord,
  MicrotaskRecord,
  Task,
  TaskRecord,
} from '../db/TableInterfaces.auto';
import { getControllerError } from '../errors/ControllerErrors';
import * as BasicModel from '../models/BasicModel';
import * as HttpResponse from '../utils/HttpResponse';
import { KaryaHTTPContext } from './KoaContextType';
import { getWorkProviderFilter } from './Task.extra';

/**
 * Controller to get a microtask record by ID
 * @param ctx koa context
 * @param ctx.param.id ID of the microtask
 */
export async function getRecordById(ctx: KaryaHTTPContext) {
  // extract ID from params
  const id: number = ctx.params.id;
  // extract current work provider from state
  const { current_user } = ctx.state;

  try {
    // retrieve the record
    const microtaskRecord = await BasicModel.getSingle('microtask', { id });

    // check if work_provider has access to the record
    if (!current_user.admin) {
      // extract task record for the microtask
      const task = await BasicModel.getSingle('task', {
        id: microtaskRecord.task_id,
      });

      if (task.work_provider_id != current_user.id) {
        HttpResponse.NotFound(ctx, 'Requested resource not found');
        return;
      }
    }
    // success
    HttpResponse.OK(ctx, microtaskRecord);
  } catch (e) {
    const message = getControllerError(e);
    HttpResponse.NotFound(ctx, message);
  }
}

/**
 * Controller for microtask records. Need to filter with work_provider ID
 * if not admin or if explicit filter is specified
 * @param ctx koa context
 */
export async function getRecords(ctx: KaryaHTTPContext) {
  try {
    // generate the microtask filter
    const microtaskFilter: Microtask = {};
    if (ctx.request.query.task_id) {
      // @ts-ignore
      microtaskFilter.task_id = ctx.request.query.task_id;
    }

    if (ctx.request.query.microtask_group_id) {
      // @ts-ignore
      microtaskFilter.group_id = ctx.request.query.microtask_group_id;
    }

    // generate a work provider filter if necessary
    const workProviderFilter: Task = getWorkProviderFilter(ctx);

    let records: MicrotaskRecord[] = [];
    // if there is a work provider filter
    if (workProviderFilter.work_provider_id) {
      records = await knex<MicrotaskRecord>('microtask')
        .select()
        .where(microtaskFilter)
        .whereIn(
          'task_id',
          knex<TaskRecord>('task')
            .select()
            .where(workProviderFilter),
        );
    } else {
      records = await BasicModel.getRecords('microtask', microtaskFilter);
    }

    // send the records
    HttpResponse.OK(ctx, records);
  } catch (e) {
    const message = getControllerError(e);
    HttpResponse.GenericError(ctx, message);
  }
}

/**
 * Get all microtasks that have completed assignments
 * @param ctx Karya koa context
 */
export async function getMicrotasksWithCompletedAssignments(
  ctx: KaryaHTTPContext,
) {
  try {
    // generate microtask filter
    const microtaskFilter: Microtask = {};
    tableFilterColumns['microtask'].forEach(col => {
      if (ctx.request.query[col]) {
        // @ts-ignore
        microtaskFilter[col] = ctx.request.query[col];
      }
    });

    // get the records
    const microtasks = await knex<MicrotaskRecord>('microtask as m')
      .select()
      .where(microtaskFilter)
      .whereExists(
        knex<MicrotaskAssignmentRecord>('microtask_assignment')
          .where({ status: 'completed' })
          .whereRaw('microtask_id = m.id'),
      );
    HttpResponse.OK(ctx, microtasks);
  } catch (e) {
    const message = getControllerError(e);
    HttpResponse.GenericError(ctx, message);
  }
}
