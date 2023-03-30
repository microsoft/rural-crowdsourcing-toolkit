// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Handler to handle completed microtasks of a task. This handler invokes the
// backward link handler for all the links for which the task is a "to" task.

import { BasicModel, TaskOpModel } from '@karya/common';
import { TaskOpRecord, TaskRecordType } from '@karya/core';
import { ChainedMicrotaskRecordType } from '../../chains/BackendChainInterface';
import { Promise as BBPromise } from 'bluebird';
import { executeBackwardLink } from '../../chains/Index';

export type BackwardTaskLinkHandlerObject = {
  taskOp: TaskOpRecord;
  task: TaskRecordType;
};

/**
 * Execute all the backward links for a task. The set of completed microtasks is
 * implicitly all the microtasks completed between the current and previous
 * completed invocation of this handler for this task.
 * @param btlObject Backward task link object
 */
export async function executeBackwardTaskLinks(btlObject: BackwardTaskLinkHandlerObject) {
  const { task, taskOp } = btlObject;

  // Get the most recent backward task link handlers for this task
  const lastOpTime = await TaskOpModel.previousOpTime(taskOp);
  const currentOpTime = taskOp.created_at;

  // Get all completed microtasks t be processed
  const microtasks = (await BasicModel.getRecords(
    'microtask',
    { task_id: task.id, status: 'COMPLETED' },
    [],
    [['last_updated_at', lastOpTime, currentOpTime]]
  )) as ChainedMicrotaskRecordType[];

  // Group microtasks based on link id
  const linkMap: { [id: string]: ChainedMicrotaskRecordType[] } = {};
  microtasks.forEach((mt) => {
    if (mt.input.chain) {
      const linkId = mt.input.chain.linkId;
      if (linkId) {
        if (linkId in linkMap) linkMap[linkId].push(mt);
        else linkMap[linkId] = [mt];
      }
    }
  });

  // Execute each reverse link
  await BBPromise.mapSeries(Object.entries(linkMap), async ([linkId, mts]) => {
    const link = await BasicModel.getSingle('task_link', { id: linkId });
    await executeBackwardLink(mts, link);
  });
}
