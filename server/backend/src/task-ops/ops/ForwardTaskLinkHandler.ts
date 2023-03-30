// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Handler for handling completed assignments of a particular task. This handler
// triggers all the chains for the task. If there are no blocking chains, then
// this handler also marks all the completed assignments as verified with
// awarded credits same as the source microtask. The set of assignments
// processed by this handler is implicitly inferred as all the assignments in
// the completed state that were submitted to the server between the invocation
// of this instance of the handler and the previous invocation of the handler.

import { BasicModel, TaskOpModel } from '@karya/common';
import { AssignmentRecordType, TaskOpRecord, TaskRecordType } from '@karya/core';
import { Promise as BBPromise } from 'bluebird';
import { executeForwardLink } from '../../chains/Index';
import { handleNewlyCompletedAssignments } from '../policies/Index';

export type ForwardTaskLinkHandlerObject = {
  taskOp: TaskOpRecord;
  task: TaskRecordType;
};

/**
 * Handle all completed assignments of a particular task between the current and
 * previous invocation of the completion handler
 * @param achObject Completion handler object
 */
export async function executeForwardTaskLinks(achObject: ForwardTaskLinkHandlerObject) {
  const { task, taskOp } = achObject;

  // Get the most recent assignment completion handler task op for this task
  const lastOpTime = await TaskOpModel.previousOpTime(taskOp);
  const currentOpTime = taskOp.created_at;

  // Get all completed assignments to be processed
  const assignments = (await BasicModel.getRecords(
    'microtask_assignment',
    { task_id: task.id, status: 'COMPLETED' },
    [],
    [['submitted_to_server_at', lastOpTime, currentOpTime]],
    'id'
  )) as AssignmentRecordType[];

  // Get all active task links for the task
  const links = await BasicModel.getRecords('task_link', { from_task: task.id, status: 'ACTIVE' });

  // Execute all links
  let blocking = false;
  await BBPromise.mapSeries(links, async (link) => {
    if (link.blocking) blocking = true;
    await executeForwardLink(assignments, task, link);
  });

  // If no link is blocking, then invoke verification policy for the assignments
  if (!blocking) {
    await handleNewlyCompletedAssignments(assignments, task);
  }
}
