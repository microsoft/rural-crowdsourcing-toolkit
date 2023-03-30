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
};

/**
 * Update the profile information of existing workers
 */
export const updateWorkers: BoxRouteMiddleware = async (ctx) => {
  const workers: WorkerRecord[] = ctx.request.body;

  const failedIds: string[] = [];
  const response: Pick<WorkerRecord, 'id' | 'sent_to_server_at'>[] = [];
  const sent_to_server_at = new Date().toISOString();

  await BBPromise.mapSeries(workers, async (worker) => {
    try {
      const { phone_number, reg_mechanism, year_of_birth, gender, full_name, language } = worker;
      await BasicModel.updateSingle(
        'worker',
        { id: worker.id },
        { phone_number, reg_mechanism, year_of_birth, gender, full_name, language, sent_to_server_at }
      );
      response.push({ id: worker.id, sent_to_server_at });
    } catch (e) {
      failedIds.push(worker.id);
    }
  });

  // TODO: Handle failed IDs

  HttpResponse.OK(ctx, response);
};

/**
 * Get all updated workers. The server can only update the tags
 */
export const get: BoxRouteMiddleware = async (ctx) => {
  let from = ctx.query.from || new Date(0).toISOString();
  if (from instanceof Array) from = from[0];

  const workers = await BasicModel.getRecords(
    'worker',
    { box_id: ctx.state.entity.id },
    [],
    [['tags_updated_at', from, null]],
    'tags_updated_at'
  );
  const response = workers.map((w) => {
    return { id: w.id, tags: w.tags, tags_updated_at: w.tags_updated_at };
  });
  HttpResponse.OK(ctx, response);
};
