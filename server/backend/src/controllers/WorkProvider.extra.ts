// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Implements APIs on the server_user table. These APIs require extra checks to
// ensure that a work provider is allowed to access only there records.

import { WorkProvider, BasicModel } from '@karya/common';
import { getControllerError } from './ControllerErrors';
import { getCreationCode } from '@karya/misc-utils';
import * as HttpResponse from '@karya/http-response';
import { KaryaHTTPContext } from './KoaContextType';

/**
 * Generate a creation code for a new work provider. Create a temporary work
 * provider object with the generated creation code and return it
 * @param ctx koa context object
 */
export async function generateCreationCode(ctx: KaryaHTTPContext) {
  try {
    // Get basic input from the context
    const workProvider: WorkProvider = ctx.request.body;

    /** Generate a creation code and ensure it is not repeated */
    let access_code = '';
    while (true) {
      try {
        access_code = getCreationCode({
          length: 16,
          numeric: false,
        });
        await BasicModel.getSingle('server_user', { access_code });
      } catch (e) {
        // Exception indicates that the record is not there.
        break;
      }
    }

    /** Update creation code in  work provider object */
    // Admin cannot be created via the web portal
    workProvider.role = 'work_provider';
    workProvider.access_code = access_code;

    /** Insert the work provider object and return it */
    const record = await BasicModel.insertRecord('server_user', workProvider);
    HttpResponse.OK(ctx, record);
  } catch (e) {
    const message = getControllerError(e);
    HttpResponse.GenericError(ctx, message);
  }
}

/**
 * Gets the work provider by id
 * @param ctx koa context object
 * @param ctx.params.id work provider id
 * @returns returns the work provider object in the body
 */
export async function getRecordById(ctx: KaryaHTTPContext) {
  // extract ID from the context
  const { id } = ctx.params;

  // get the current user
  const { current_user } = ctx.state;

  // check if the user is authorized to get the record
  if (current_user.role != 'admin' && current_user.id != id) {
    HttpResponse.Forbidden(ctx, 'Unauthorized access');
    return;
  }

  try {
    // get the work provider record
    const record = await BasicModel.getSingle('server_user', { id });
    HttpResponse.OK(ctx, record);
  } catch (e) {
    const message = getControllerError(e);
    HttpResponse.NotFound(ctx, message);
  }
}

/**
 * Updates work provider object
 * @param ctx koa context object
 * @param ctx.request.body updated work provider object
 * @param ctx.params.id ID of the work provider to be updated
 * @returns returns the work provider object in the body
 */
export async function updateRecordById(ctx: KaryaHTTPContext) {
  // extract the ID from params
  const id = ctx.params.id;

  // get current user
  const { current_user } = ctx.state;

  // check if the user is authorized to update the record
  if (current_user.role != 'admin' && current_user.id != id) {
    HttpResponse.Forbidden(ctx, 'Unauthorized access to record');
    return;
  }

  // extract updates from the body
  const updates: WorkProvider = ctx.request.body;

  // work provider cannot update the id and admin fields
  delete updates.role;
  delete updates.id;

  try {
    // attempt to update the record
    const record = await BasicModel.updateSingle('server_user', { id }, updates);
    HttpResponse.OK(ctx, record);
  } catch (e) {
    const message = getControllerError(e);
    HttpResponse.NotFound(ctx, message);
  }
}
