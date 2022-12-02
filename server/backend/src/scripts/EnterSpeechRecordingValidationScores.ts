// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// CLI to enter speech transcription validation

import dotenv from 'dotenv';
dotenv.config();

import { knex, setupDbConnection, setupBlobStore, BasicModel } from '@karya/common';
import { promises as fsp } from 'fs';
import { Promise as BBPromise } from 'bluebird';
import { TaskRecordType } from '@karya/core';
import { ChainedMicrotaskRecordType } from '../chains/BackendChainInterface';

// Get the validation file
const validationFile = process.argv[2];
if (!validationFile || validationFile == '') {
  console.log('Invalid validation file');
  process.exit(0);
}

/** Main Script */
(async () => {
  setupDbConnection();

  const data = await fsp.readFile(validationFile);
  const lines = data.toString().split('\n');

  await BBPromise.mapSeries(lines, async (line) => {
    const [speechTranscriptionValidationMTId, transcriptionRating, recordingRating] = line.split('\t');

    // Update the microtask output
    const speechTranscriptionValidationMT = (await BasicModel.getSingle('microtask', {
      id: speechTranscriptionValidationMTId,
    })) as ChainedMicrotaskRecordType<'SPEECH_VERIFICATION'>;

    const recordingFileName = speechTranscriptionValidationMT.input.files!.recording;
    const recordingAssignmentId = recordingFileName.replace('.wav', '');

    const accuracy =
      recordingRating == 'good' ? 1 : recordingRating == 'okay' ? 0.5 : recordingRating == 'bad' ? 0 : null;
    if (accuracy == null) {
      console.log(`Invalid rating for recording assignment ${recordingAssignmentId}`);
      return;
    }
    const fraction = accuracy == 1 ? 1 : 0;
    const report = { accuracy, fraction };

    // Update the verification and report for the source assignment
    const assignment = await BasicModel.getSingle('microtask_assignment', { id: recordingAssignmentId });
    if (assignment.status == 'VERIFIED') {
      return;
    }

    const now = new Date().toISOString();
    await BasicModel.updateSingle(
      'microtask_assignment',
      { id: recordingAssignmentId },
      { status: 'VERIFIED', verified_at: now, report, credits: assignment.max_credits * fraction }
    );
  });
})().finally(() => knex.destroy());
