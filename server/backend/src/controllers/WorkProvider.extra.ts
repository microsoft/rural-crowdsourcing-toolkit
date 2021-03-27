// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Implements APIs on the work_provider table. These APIs require extra checks to
// ensure that a work provider is allowed to access only there records.

import { WorkProvider } from '../db/TableInterfaces.auto';
import { getControllerError } from '../errors/ControllerErrors';
import * as BasicModel from '../models/BasicModel';
import { getCreationCode } from '@karya/misc-utils';
import * as HttpResponse from '@karya/http-response';
import { KaryaHTTPContext } from './KoaContextType';
import config from '../config/Index';

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
    let creation_code = '';
    while (true) {
      try {
        creation_code = getCreationCode({
          length: config.creationCodeLength,
          numeric: false,
        });
        await BasicModel.getSingle('work_provider', { creation_code });
      } catch (e) {
        // Exception indicates that the record is not there.
        break;
      }
    }

    /** Update creation code in  work provider object */
    // Admin cannot be created via the web portal
    workProvider.admin = false;
    workProvider.creation_code = creation_code;

    /** Insert the work provider object and return it */
    const record = await BasicModel.insertRecord('work_provider', workProvider);
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
  if (!current_user.admin && current_user.id != id) {
    HttpResponse.Forbidden(ctx, 'Unauthorized access');
    return;
  }

  try {
    // get the work provider record
    const record = await BasicModel.getSingle('work_provider', { id });
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
  const id: number = ctx.params.id;

  // get current user
  const { current_user } = ctx.state;

  // check if the user is authorized to update the record
  if (!current_user.admin && current_user.id != id) {
    HttpResponse.Forbidden(ctx, 'Unauthorized access to record');
    return;
  }

  // extract updates from the body
  const updates: WorkProvider = ctx.request.body;

  // work provider cannot update the id and admin fields
  delete updates.admin;
  delete updates.id;

  try {
    // attempt to update the record
    const record = await BasicModel.updateSingle(
      'work_provider',
      { id },
      updates,
    );
    HttpResponse.OK(ctx, record);
  } catch (e) {
    const message = getControllerError(e);
    HttpResponse.NotFound(ctx, message);
  }
}
