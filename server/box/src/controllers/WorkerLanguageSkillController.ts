// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Extra controllers for worker language skill
 */

import { WorkerLanguageSkill } from '@karya/db';
import { getControllerError } from '../errors/ControllerErrors';
import * as BasicModel from '../models/BasicModel';
import * as HttpResponse from '@karya/http-response';
import { KaryaHTTPContext } from './KoaContextType';

/**
 * Insert a new worker-language skill record. If a record already exists, then
 * simply return that record.
 */
export async function insertRecord(ctx: KaryaHTTPContext) {
  const wls: WorkerLanguageSkill = ctx.request.body;

  try {
    const record = await BasicModel.getSingle('worker_language_skill', {
      worker_id: wls.worker_id,
      language_id: wls.language_id,
    });
    HttpResponse.OK(ctx, record);
    return;
  } catch (e) {
    // Record does not exist.
    // Fall through and create the new record
  }

  try {
    const record = await BasicModel.insertRecord('worker_language_skill', wls);
    HttpResponse.OK(ctx, record);
  } catch (e) {
    const message = getControllerError(e);
    HttpResponse.BadRequest(ctx, message);
  }
}
