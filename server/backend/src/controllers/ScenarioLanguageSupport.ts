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
  // get the lr filter from query params
  const { query } = ctx.request;
  const lrFilter: LanguageResource = {};
  tableFilterColumns['language_resource'].forEach(col => {
    if (query[col]) {
      // @ts-ignore
      lrFilter[col] = query[col];
    }
  });

  try {
    const languageIds = await ScenarioLanguageModel.getSupportedLanguages(
      lrFilter,
    );
    HttpResponse.OK(ctx, languageIds);
  } catch (e) {
    const message = getControllerError(e);
    HttpResponse.NotFound(ctx, message);
  }
}
