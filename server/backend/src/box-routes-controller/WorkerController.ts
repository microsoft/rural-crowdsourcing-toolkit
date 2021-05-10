// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Handler for worker related routes

import { WorkerRecord } from '@karya/core';
import { BoxRouteMiddleware } from '../routes/BoxRoutes';
import { Promise as BBPromise } from 'bluebird';
import { BasicModel } from '@karya/common';
import * as HttpResponse from '@karya/http-response';

/**
 * Add new workers from a box into the server
 */
export const newWorkers: BoxRouteMiddleware = async (ctx) => {
  const workers: WorkerRecord[] = ctx.request.body;

  const failedIds: string[] = [];
  const response: Pick<WorkerRecord, 'id' | 'sent_to_server_at'>[] = [];
  const sent_to_server_at = new Date().toISOString();

  try {
    await BBPromise.mapSeries(workers, async (worker) => {
      try {
        await BasicModel.insertRecord('worker', { ...worker, sent_to_server_at });
        response.push({ id: worker.id, sent_to_server_at });
      } catch (e) {
        // Record with ID already exists
        try {
          const current = await BasicModel.getSingle('worker', { id: worker.id });
          response.push({ id: current.id, sent_to_server_at: current.sent_to_server_at });
        } catch (e) {
          failedIds.push(worker.id);
        }
      }
    });

    // TODO: Handle failed IDs

    HttpResponse.OK(ctx, response);
  } catch (e) {
    // TODO: convert to internal server error
    HttpResponse.BadRequest(ctx, 'Unknown error occured while adding new workers');
  }
};

/**
 * Update the profile information of existing workers
 */
export const updateWorkers: BoxRouteMiddleware = async (ctx) => {
  const workers: WorkerRecord[] = ctx.request.body;

  const failedIds: string[] = [];
  const response: Pick<WorkerRecord, 'id' | 'sent_to_server_at'>[] = [];
  const sent_to_server_at = new Date().toISOString();

  try {
    await BBPromise.mapSeries(workers, async (worker) => {
      try {
        const { year_of_birth, gender, full_name, language } = worker;
        await BasicModel.updateSingle(
          'worker',
          { id: worker.id },
          { year_of_birth, gender, full_name, language, sent_to_server_at }
        );
        response.push({ id: worker.id, sent_to_server_at });
      } catch (e) {
        failedIds.push(worker.id);
      }
    });

    // TODO: Handle failed IDs

    HttpResponse.OK(ctx, response);
  } catch (e) {
    // TODO: convert to internal server error
    HttpResponse.BadRequest(ctx, 'Unknown error occured while adding new workers');
  }
};
