// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Controller for extra language routes
 */

import { getControllerError } from '../errors/ControllerErrors';
import * as BasicModel from '../models/BasicModel';
import { isLanguageSupported } from '../models/ScenarioLanguageModel';
import * as HttpResponse from '@karya/http-response';
import { KaryaHTTPContext } from './KoaContextType';

/**
 * Controller to update the supported status of a language. ID is passed via path.
 * @param ctx Karya koa context
 */
export async function updateSupported(ctx: KaryaHTTPContext) {
  // Extract ID from params
  const id: number = ctx.params.id;

  try {
    const string_support = await isLanguageSupported(id, {
      core: true,
      type: 'string_resource',
    });
    const file_support = await isLanguageSupported(id, {
      type: 'file_resource',
    });
    const list_support = await isLanguageSupported(id, {
      type: 'string_resource',
      list_resource: true,
    });

    const updatedLanguageRecord = await BasicModel.updateSingle(
      'language',
      { id },
      { string_support, file_support, list_support },
    );
    HttpResponse.OK(ctx, updatedLanguageRecord);
  } catch (e) {
    const message = getControllerError(e);
    HttpResponse.BadRequest(ctx, message);
  }
}
