// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Controllers for the worker table
 */

import { Worker, WorkerRecord } from '../db/TableInterfaces.auto';
import * as BasicModel from '../models/BasicModel';
import { getCreationCode } from '../utils/CreationCodeGenerator';
import * as HttpResponse from '../utils/HttpResponse';
import { KaryaHTTPContext } from './KoaContextType';

/**
 * Generate a set of worker creation codes for a specific box. The request body
 * specifies the ID of the box, and number of worker creation codes to generate
 * @param ctx Koa context
 */
export async function generateWorkerCCs(ctx: KaryaHTTPContext) {
  // Extract the box_id and the number of CCs to generate
  const box_id: number = ctx.request.body.box_id;
  const num_ccs: number = ctx.request.body.num_ccs;

  // Check for valid request
  if (!(box_id && num_ccs)) {
    HttpResponse.BadRequest(ctx, 'Need to specify box ID and number of codes');
    return;
  }

  // Repeat for num_cc times
  let continuousErrors = 0;
  const newWorkers: WorkerRecord[] = [];
  while (newWorkers.length < num_ccs && continuousErrors < 3) {
    // Get a creation code
    const creation_code = getCreationCode({ numeric: true });

    // Generate a worker record
    const worker: Worker = {
      creation_code,
      box_id,
      full_name: '',
    };

    try {
      const workerRecord = await BasicModel.insertRecord('worker', worker);
      newWorkers.push(workerRecord);
      continuousErrors = 0;
    } catch (e) {
      continuousErrors += 1;
    }
  }

  // Check if there is a continuous error
  // DB server is possibly down
  if (continuousErrors == 3) {
    HttpResponse.BadRequest(ctx, 'Request failed');
    return;
  }

  HttpResponse.OK(ctx, newWorkers);
}
