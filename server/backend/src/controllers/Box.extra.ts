// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Implements additional APIs for the 'box' table that could not be auto
// implemented.

import { Box } from '../db/TableInterfaces.auto';
import { getControllerError } from '../errors/ControllerErrors';
import * as BasicModel from '../models/BasicModel';
import { getCreationCode } from '../utils/CreationCodeGenerator';
import * as HttpResponse from '@karya/http-response';
import { KaryaHTTPContext } from './KoaContextType';

/**
 * Creates a sample box with a new creation code and respond with the box record
 * @param ctx koa context object
 */
export async function generateCreationCode(ctx: KaryaHTTPContext) {
  try {
    // Get basic box info
    const box: Box = ctx.request.body;

    // Generate creation code and ensure it is not repeated
    let creation_code = '';
    while (true) {
      try {
        creation_code = getCreationCode();
        await BasicModel.getSingle('box', { creation_code });
      } catch (e) {
        // Exception indicates that the creation code is already present
        break;
      }
    }

    // Update box record with creation code and return it
    box.creation_code = creation_code;

    // Insert the record and return it
    const record = await BasicModel.insertRecord('box', box);
    HttpResponse.OK(ctx, record);
  } catch (e) {
    const message = getControllerError(e);
    HttpResponse.GenericError(ctx, message);
  }
}
