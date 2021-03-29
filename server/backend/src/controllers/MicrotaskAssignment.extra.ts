// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Extra microtask assignment controllers
 */

import { Promise as BBPromise } from 'bluebird';
import { knex } from '../db/Client';
import { tableFilterColumns } from '../db/TableFilterColumns.auto';
import {
  KaryaFileRecord,
  MicrotaskAssignment,
  MicrotaskAssignmentRecord,
} from '../db/TableInterfaces.auto';
import { getControllerError } from '../errors/ControllerErrors';
import * as BasicModel from '../models/BasicModel';
import { getBlobSASURL } from '../utils/AzureBlob';
import * as HttpResponse from '@karya/http-response';
import { KaryaHTTPContext } from './KoaContextType';

/**
 * Get list of microtask assignments with specified filters. Added filters
 * include limit and order
 * @param ctx Karya koa context
 */
export async function getRecords(ctx: KaryaHTTPContext) {
  try {
    const microtaskAssignmentFilter: MicrotaskAssignment = {};
    tableFilterColumns['microtask_assignment'].forEach(col => {
      if (ctx.request.query[col]) {
        // @ts-ignore
        microtaskAssignmentFilter[col] = ctx.request.query[col];
      }
    });

    const limit = ctx.request.query['limit'] as string;
    let records: MicrotaskAssignmentRecord[];
    if (limit) {
      records = await knex<MicrotaskAssignmentRecord>('microtask_assignment')
        .select()
        .where(microtaskAssignmentFilter)
        .orderBy('completed_at')
        .limit(Number.parseInt(limit, 10));
    } else {
      records = await knex<MicrotaskAssignmentRecord>('microtask_assignment')
        .select()
        .where(microtaskAssignmentFilter)
        .orderBy('completed_at');
    }

    const files = (
      await BBPromise.map(records, async record => {
        if (record.output_file_id) {
          const file = await BasicModel.getSingle('karya_file', {
            id: record.output_file_id,
          });
          if (file.url != null) {
            file.url = getBlobSASURL(file.url, 'r', 30);
          }
          return file;
        }
      })
    ).filter((kf): kf is KaryaFileRecord => kf !== undefined);

    HttpResponse.OK(ctx, { assignments: records, files });
  } catch (e) {
    const message = getControllerError(e);
    HttpResponse.GenericError(ctx, message);
  }
}
