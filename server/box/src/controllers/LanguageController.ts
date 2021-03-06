// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as HttpResponse from '../utils/HttpResponse';
import { KaryaHTTPContext } from './KoaContextType';

import { tableFilterColumns } from '../db/TableFilterColumns.auto';
import { LanguageResource } from '../db/TableInterfaces.auto';
import { getControllerError } from '../errors/ControllerErrors';
import * as ScenarioLanguageModel from '../models/ScenarioLanguageModel';

/**
 * Controller to get the list of supported languages for a given scenario
 * @param ctx koa context
 * @param ctx.request.query.scenario_id ID of the scenario
 */
export async function getSupportedLanguages(ctx: KaryaHTTPContext) {
  try {
    const languages = await ScenarioLanguageModel.getSupportedLanguages({});
    HttpResponse.OK(ctx, languages);
  } catch (e) {
    const message = getControllerError(e);
    HttpResponse.NotFound(ctx, message);
  }
}
