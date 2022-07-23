// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Entry point for the backend task chaining module

import { BasicModel } from '@karya/common';
import { AssignmentRecordType, ChainName, MicrotaskRecordType, TaskLinkRecord, TaskRecordType } from '@karya/core';
import { Promise as BBPromise } from 'bluebird';
import { handleNewlyCompletedAssignments } from '../task-ops/policies/Index';

import { BackendChainInterface, ChainedMicrotaskRecordType, ChainedMicrotaskType } from './BackendChainInterface';
import { imageAnnotationValidation } from './chains/ImageAnnotationValidation';
import { sentenceCorpusValidationChain } from './chains/SentenceCorpusValidation';
import { signLanguageVideoValidation } from './chains/SignLanguageVideoValidation';
import { speechValidationChain } from './chains/SpeechValidation';
import { xliterationValidationChain } from './chains/XliterationValidation';

// Backend chain map
export const backendChainMap: { [key in ChainName]: BackendChainInterface<any, any> } = {
  SPEECH_VALIDATION: speechValidationChain,
  XLITERATION_VALIDATION: xliterationValidationChain,
  SIGN_VIDEO_VALIDATION: signLanguageVideoValidation,
  SENTENCE_CORPUS_VALIDATION: sentenceCorpusValidationChain,
  IMAGE_ANNOTATION_VALIDATION: imageAnnotationValidation,
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

  // if worker groups have to be forced
  if (link.force_wgroup) {
    assignments = assignments.filter((mta) => mta.wgroup === toTask.wgroup);
  }

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
        linkId: link.id,
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

/**
 * Execute a backward link on a set of completed microtasks
 * @param microtasks List of completed microtasks
 * @param link Link record
 */
export async function executeBackwardLink(microtasks: ChainedMicrotaskRecordType[], link: TaskLinkRecord) {
  // Extract the chain object
  const chainObj = backendChainMap[link.chain];

  // Get the from and to task
  const fromTask = (await BasicModel.getSingle('task', { id: link.from_task })) as TaskRecordType;
  const toTask = (await BasicModel.getSingle('task', { id: link.to_task })) as TaskRecordType;

  // Invoke the chain and get the verified assignments
  const assignments = await BBPromise.mapSeries(microtasks, async (mt) => {
    const assignment = await BasicModel.getSingle('microtask_assignment', { id: mt.input.chain.assignmentId });
    return assignment as AssignmentRecordType;
  });
  const verifiedAssignments = await chainObj.handleCompletedToMicrotasks(fromTask, toTask, microtasks, assignments);

  // Update the assignment verification status if link is blocking
  if (link.blocking) await handleNewlyCompletedAssignments(verifiedAssignments, fromTask);
}
