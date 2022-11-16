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
    const [mtid, rating] = line.split('\t');

    const accuracy = rating == 'good' ? 2 : rating == 'okay' ? 1 : rating == 'bad' ? 0 : null;
    if (accuracy == null) {
      console.log(`Invalid rating for mtid ${mtid}`);
      return;
    }
    const fraction = accuracy == 2 ? 1 : 0;

    const report = { accuracy, fraction };

    // Update the microtask output
    const updatedRecord = (await BasicModel.updateSingle(
      'microtask',
      { id: mtid },
      { output: { data: report }, status: 'COMPLETED' }
    )) as ChainedMicrotaskRecordType;

    // Update the verification and report for the source assignment
    const asstId = updatedRecord.input.chain.assignmentId;
    const assignment = await BasicModel.getSingle('microtask_assignment', { id: asstId });
    const now = new Date().toISOString();
    await BasicModel.updateSingle(
      'microtask_assignment',
      { id: asstId },
      { status: 'VERIFIED', verified_at: now, report, credits: assignment.max_credits * fraction }
    );
  });
})().finally(() => knex.destroy());
