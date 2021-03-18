// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Controllers for authentication
 */

import { signUpUser } from '../auth-providers/Index';
import {
  AuthProviderType,
  WorkProvider,
  WorkProviderRecord,
} from '../db/TableInterfaces.auto';
import { getControllerError } from '../errors/ControllerErrors';
import * as BasicModel from '../models/BasicModel';
import * as HttpResponse from '../utils/HttpResponse';
import { KaryaHTTPContext } from './KoaContextType';

/**
 * updates the work provider object via creation code === sign-up
 * @param ctx koa context object
 * @param ctx.request.body The work provider object
 */
export async function updateWithCreationCode(ctx: KaryaHTTPContext) {
  const workProvider: WorkProvider = ctx.request.body;
  let workProviderRecord: WorkProviderRecord;

  /** Check if the creation code is valid */
  try {
    const { creation_code } = workProvider;
    workProviderRecord = await BasicModel.getSingle('work_provider', {
      creation_code,
    });
  } catch (e) {
    HttpResponse.BadRequest(ctx, 'Invalid creation code');
    return;
  }

  /** Creation code already used check */
  if (workProviderRecord.auth_provider !== null) {
    HttpResponse.BadRequest(ctx, 'Creation code already in use');
    return;
  }

  try {
    /** Sign up the user */
    workProvider.id = workProviderRecord.id;
    const authResponse = await signUpUser(workProvider);

    /** Set response based on status */
    if (authResponse.success === true) {
      // Set the cookie with id_token
      const wp = authResponse.wp;
      // assert that the auth_provider and id_token are not null
      HttpResponse.setCookie(
        ctx,
        'auth-provider',
        wp.auth_provider as AuthProviderType,
      );
      HttpResponse.setCookie(ctx, 'id-token', wp.id_token as string);
      HttpResponse.OK(ctx, authResponse.wp);
    } else {
      HttpResponse.Unauthorized(ctx, authResponse.message);
    }
  } catch (e) {
    const message = getControllerError(e);
    HttpResponse.GenericError(ctx, message);
  }
}

/**
 * Authenticate a work provider token and return the work provider object on success
 * @param ctx koa context object
 * @returns returns the work provider object in the body
 */
export async function signIn(ctx: KaryaHTTPContext) {
  HttpResponse.OK(ctx, ctx.state.current_user);
}

/**
 * Creates a sample work provider object
 * @param ctx koa context object
 * @returns invalidates the work provider jwt token
 */
export async function signOut(ctx: KaryaHTTPContext) {
  /** Clear the current work provider state */
  HttpResponse.OK(ctx, {});
}
