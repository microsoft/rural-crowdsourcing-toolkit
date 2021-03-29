// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Implements APIs for 'payment_request' that could not be auto-generated

import { knex } from '../db/Client';
import { getControllerError } from '../errors/ControllerErrors';
import * as BasicModel from '../models/BasicModel';
import * as HttpResponse from '@karya/http-response';
import { KaryaHTTPContext } from './KoaContextType';

import {
  PaymentRequestRecord,
  PayoutInfo,
  PayoutInfoRecord,
} from '../db/TableInterfaces.auto';

/**
 * Function to retrieve payment request records. This request can have a
 * worker_id filter, which requires a join with the payout info table.
 * @param ctx koa context
 */
export async function getRecords(ctx: KaryaHTTPContext) {
  try {
    let records: PaymentRequestRecord[] = [];

    // check if there is a worker_id filter
    if (ctx.request.query.worker_id) {
      // create the worker filter
      const workerFilter: PayoutInfo = {
        worker_id: ctx.request.query.worker_id as string,
      };

      // retrieve the records
      records = await knex<PaymentRequestRecord>('payment_request')
        .select()
        .whereIn(
          'payout_info_id',
          knex<PayoutInfoRecord>('payout_info')
            .select('id')
            .where(workerFilter),
        );
    } else {
      records = await BasicModel.getRecords('payment_request', {});
    }

    // return list of retrieved records
    HttpResponse.OK(ctx, records);
  } catch (e) {
    const message = getControllerError(e);
    HttpResponse.GenericError(ctx, message);
  }
}
