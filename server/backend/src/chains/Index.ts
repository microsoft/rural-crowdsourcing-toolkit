// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Entry point for the backend task chaining module

import { BasicModel } from '@karya/common';
import { AssignmentRecordType, ChainName, MicrotaskRecordType, TaskLinkRecord, TaskRecordType } from '@karya/core';
import { Promise as BBPromise } from 'bluebird';

import { BackendChainInterface, ChainedMicrotaskType } from './BackendChainInterface';
import { speechValidationChain } from './chains/SpeechValidation';

// Backend chain map
export const backendChainMap: { [key in ChainName]: BackendChainInterface<any, any> } = {
  SPEECH_VALIDATION: speechValidationChain,
};

/**
 * Execute the forward link on a set of completed assignments.
 * @param assignments List of completed assignments of the from task
 * @param fromTask From task record
 * @param link Link to be exectued
 */
export async function executeForwardLink(
  assignments: AssignmentRecordType[],
  fromTask: TaskRecordType,
  link: TaskLinkRecord
) {
  // Extract the chain object
  const chainObj = backendChainMap[link.chain];

  // Get to task
  const toTask = (await BasicModel.getSingle('task', { id: link.to_task })) as TaskRecordType;

  // Get all microtasks
  const microtasks = await BBPromise.mapSeries(assignments, async (assignment) => {
    return BasicModel.getSingle('microtask', { id: assignment.microtask_id }) as Promise<MicrotaskRecordType>;
  });

  // TODO: Need to handle other link parameters appropriately
  // Invoke the link
  const toMicrotasks = await chainObj.handleCompletedFromAssignments(fromTask, toTask, assignments, microtasks);

  // Create the chained microtasks objects
  const chainedMicrotasks = toMicrotasks.map((mt, i) => {
    const assignment = assignments[i];
    const input: ChainedMicrotaskType['input'] = {
      ...mt.input!,
      chain: {
        taskId: fromTask.id,
        workerId: assignment.worker_id,
        assignmentId: assignment.id,
        microtaskId: assignment.microtask_id,
      },
    };
    const chainedMT: ChainedMicrotaskType = {
      ...mt,
      input,
    };
    return chainedMT;
  });

  // Insert the chained microtasks
  await BBPromise.mapSeries(chainedMicrotasks, async (mt) => {
    await BasicModel.insertRecord('microtask', mt);
  });
}
