// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Entry point for the backend task chaining module

import { BasicModel } from '@karya/common';
import {
  AssignmentRecordType,
  BlobParameters,
  ChainName,
  getBlobName,
  MicrotaskRecordType,
  TaskLinkRecord,
  TaskRecordType,
} from '@karya/core';
import { Promise as BBPromise } from 'bluebird';
import { handleNewlyCompletedAssignments } from '../task-ops/policies/Index';
import { envGetString } from '@karya/misc-utils';
import { promises as fsp } from 'fs';
import tar from 'tar';

import { BackendChainInterface, ChainedMicrotaskRecordType, ChainedMicrotaskType } from './BackendChainInterface';
import { imageAnnotationValidation } from './chains/ImageAnnotationValidation';
import { sentenceCorpusValidationChain } from './chains/SentenceCorpusValidation';
import { signLanguageVideoValidation } from './chains/SignLanguageVideoValidation';
import { speechTranscriptionValidationChain } from './chains/SpeechTranscriptionValidation';
import { speechValidationChain } from './chains/SpeechValidation';
import { verifiedSpeechTranscriptionChain } from './chains/VerifiedSpeechTranscription';
import { videoAnnotationValidation } from './chains/VideoAnnotationValidation';
import { xliterationValidationChain } from './chains/XliterationValidation';
import { upsertKaryaFile } from '../models/KaryaFileModel';

// Backend chain map
export const backendChainMap: { [key in ChainName]: BackendChainInterface<any, any> } = {
  SPEECH_VALIDATION: speechValidationChain,
  XLITERATION_VALIDATION: xliterationValidationChain,
  SIGN_VIDEO_VALIDATION: signLanguageVideoValidation,
  SENTENCE_CORPUS_VALIDATION: sentenceCorpusValidationChain,
  IMAGE_ANNOTATION_VALIDATION: imageAnnotationValidation,
  SPEECH_TRANSCRIPTION_VALIDATION: speechTranscriptionValidationChain,
  VIDEO_ANNOTATION_VALIDATION: videoAnnotationValidation,
  VERIFIED_SPEECH_TRANSCRIPTION: verifiedSpeechTranscriptionChain,
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

  // Create a temp folder
  const localFolder = envGetString('LOCAL_FOLDER');
  const folder_path = `${localFolder}/microtask-input/${toTask.id}`;
  try {
    await fsp.mkdir(folder_path);
  } catch (e) {
    // pass
  }

  // TODO: Need to handle other link parameters appropriately
  // Invoke the link
  const toMicrotasks = await chainObj.handleCompletedFromAssignments(
    fromTask,
    toTask,
    assignments,
    microtasks,
    folder_path
  );

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
    const mtRecord = await BasicModel.insertRecord('microtask', mt);

    // Check if the chained microtask requires a new input file
    const input_files = Object.values(mt.input!.files ?? {});
    if (input_files.length > 0 && mt.input_file_id == null) {
      const inputBlobParams: BlobParameters = {
        cname: 'microtask-input',
        microtask_id: mtRecord.id,
        ext: 'tgz',
      };
      const inputTgzFileName = getBlobName(inputBlobParams);
      const inputTgzFilePath = `${folder_path}/${inputTgzFileName}`;

      // Create the tar ball
      await tar.c({ C: folder_path, file: inputTgzFilePath, gzip: true }, input_files);
      const fileRecord = await upsertKaryaFile(inputTgzFilePath, 'MD5', inputBlobParams);

      // Update the microtask record
      await BasicModel.updateSingle('microtask', { id: mtRecord.id }, { input_file_id: fileRecord.id });
    }
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
