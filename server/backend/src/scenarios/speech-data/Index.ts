// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Specification of the speech-data scenario.
 */

import { IScenario } from '../common/ScenarioInterface';
import { estimateTaskBudget } from './BudgetEstimator';
import { generateMicrotasks } from './MicrotaskGenerator';
import { SpeechDataTask, taskParams } from './ParamDefinitions';
import { defaultPolicy } from './policy/default/Index';
import { validateTask } from './TaskValidator';
import { promises as fsp } from 'fs';
import * as tar from 'tar';
import { Promise as BBPromise } from 'bluebird';

import { knex, Microtask, MicrotaskAssignmentRecord, MicrotaskRecord, BasicModel } from '@karya/db';
import { BlobParameters, getBlobName } from '@karya/blobstore';
import config from '../../config/Index';
import { downloadBlob } from '../../utils/AzureBlob';
import { gunzipFile } from '@karya/compression';
import { upsertKaryaFile } from '../../models/KaryaFileModel';
import { taskLogger } from '../../utils/Logger';

export const SpeechDataScenario: IScenario = {
  name: 'speech-data',
  full_name: 'Speech-data Collection',
  description:
    'This task consists of a set of sentences. The worker is expected to record themselves reading out each sentence, one sentence at a time',

  task_params: { params: taskParams },
  skills: { l1: { read: 1, speak: 1, type: 0 } },

  assignment_granularity: 'microtask',
  group_assignment_order: 'either',
  microtask_assignment_order: 'either',

  validateTask,
  estimateTaskBudget,
  generateMicrotasks,
  handleMicrotaskCompletion,
  handleMicrotaskAssignmentCompletion,
  outputGenerator,

  enabled: true,
  synchronous_validation: true,

  policies: [defaultPolicy],
};

/**
 * Handle completion of a speech data microtask at the server
 * @param mt Completed microtask record
 * @param task Corresponding task record
 */
async function handleMicrotaskCompletion(mt: MicrotaskRecord, task: SpeechDataTask) {}

/**
 * Handle completion of a speech data microtask assignment at the server
 * @param mta Completed microtask assignment record
 * @param mt Corresponding microtask record
 * @param task Corresponding task record
 */
async function handleMicrotaskAssignmentCompletion(
  mta: MicrotaskAssignmentRecord,
  mt: MicrotaskRecord,
  task: SpeechDataTask
) {
  // If the task requires verification, then create appropriate verification microtask.
  if (task.params.needVerification) {
    const verificationInput = {
      // @ts-ignore
      files: mta.output['files'],
      assignment: mta.id,
      max_credits: mt.credits,
      ...mt.input,
    };

    const verificationMT: Microtask = {
      task_id: task.params.verificationTaskId,
      group_id: null,
      input: verificationInput,
      input_file_id: mta.output_file_id,
      credits: 0.5,
      status: 'incomplete',
      params: {},
    };

    await BasicModel.insertRecord('microtask', verificationMT);
  } else {
    // Else, mark the task as autoverified.
    await BasicModel.updateSingle('microtask_assignment', { id: mta.id }, { status: 'verified', credits: mt.credits });
  }
}

/**
 * Output generator
 */
async function outputGenerator(task: SpeechDataTask) {
  // If task is completed, return
  if (task.status === 'completed') return;

  taskLogger.info(task);

  // If outputfiles in task params is not initialized, then initialize it
  if (!task.params.outputFiles) task.params.outputFiles = [];

  // Determine the last time
  const [lastGenerated, lastStatus, url] =
    task.params.outputFiles.length > 0
      ? task.params.outputFiles[task.params.outputFiles.length - 1]
      : [new Date(0).toISOString(), 'none' as 'none', null];

  // get current time
  const currentTime = new Date().toISOString();

  taskLogger.info(`Generating output for ${task.id} from ${lastGenerated} to ${currentTime}`);

  // If difference is less than 23 hours?, return
  const diff = new Date(currentTime).getTime() - new Date(lastGenerated).getTime();
  if (diff < 12 * 60 * 60 * 1000) {
    taskLogger.info(`Output for ${task.id}: Only recently generated`);
    return;
  }

  // Update the task params with current time
  task.params.outputFiles.push([currentTime, 'generating', null]);
  await BasicModel.updateSingle('task', { id: task.id }, { params: task.params });

  // Get all verified microtasks in the given duration
  const mts = await knex<MicrotaskRecord>('microtask').where('task_id', task.id).pluck('id');
  const mtas = await knex<MicrotaskAssignmentRecord>('microtask_assignment')
    .select()
    .where('status', 'verified')
    .where('last_updated_at', '>', lastGenerated)
    .where('last_updated_at', '<', currentTime)
    .whereIn('microtask_id', mts);

  // Mark the task params as not generated and exit
  if (mtas.length === 0) {
    task.params.outputFiles.pop();
    task.params.outputFiles.push([currentTime, 'none', null]);
    await BasicModel.updateSingle('task', { id: task.id }, { params: task.params });
    taskLogger.info(`Output for ${task.id}: No files`);
    return;
  }

  // Create the output folder
  const outputBlobParams: BlobParameters = {
    cname: 'task-output',
    task_id: task.id,
    timestamp: currentTime.replace(/:/g, '.'),
    ext: 'tgz',
  };
  const localFolderName = config.localFolder;
  const outputTgzName = getBlobName(outputBlobParams);
  const outputFolderName = outputTgzName.slice(0, -4);
  const outputTgzPath = `${localFolderName}/task-output/${outputTgzName}`;
  const outputFolderPath = `${localFolderName}/task-output/${outputFolderName}`;

  try {
    await fsp.mkdir(outputFolderPath);
  } catch (e) {
    // Folder already exists?
  }

  const files: string[] = [];

  // For each assignment,
  await BBPromise.map(mtas, async (mta) => {
    try {
      // get the microtask record
      const mt = await BasicModel.getSingle('microtask', {
        id: mta.microtask_id,
      });

      // recording name
      // @ts-ignore
      const recordingName = mta.output.files[0];
      const reportName = `${mta.id}.json`;

      // generate the output json report
      const json = {
        // @ts-ignore
        data: mt.input.data,
        file: recordingName,
        // @ts-ignore
        report: mta.params.report,
        credits: mta.credits,
        worker: mta.worker_id,
      };

      // download the tar, extract, delete tar
      const kf = await BasicModel.getSingle('karya_file', {
        id: mta.output_file_id!,
      });
      const tgzPath = `${outputFolderPath}/${kf.name}`;
      const tarPath = tgzPath.slice(0, -3) + 'tar';
      await downloadBlob(kf.url!, tgzPath);
      await gunzipFile(tgzPath, tarPath);
      await tar.x({ file: tgzPath, C: outputFolderPath });
      await fsp.unlink(tarPath);
      await fsp.unlink(tgzPath);

      // Write the report
      await fsp.writeFile(`${outputFolderPath}/${reportName}`, JSON.stringify(json, null, 2) + '\n');

      files.push(recordingName);
      files.push(reportName);
    } catch (e) {}
  });

  // Tar the folder and upload
  await tar.c({ file: outputTgzPath, C: outputFolderPath, gzip: true }, files);
  const kfRecord = await upsertKaryaFile(outputTgzPath, 'md5', outputBlobParams);

  // Update the task params
  task.params.outputFiles.pop();
  task.params.outputFiles.push([currentTime, 'generated', kfRecord.url]);
  await BasicModel.updateSingle('task', { id: task.id }, { params: task.params });

  // Delete all unnecessary files
  try {
    await BBPromise.map(files, (f) => fsp.unlink(`${outputFolderPath}/${f}`));
    await fsp.rmdir(outputFolderPath);
    await fsp.unlink(outputTgzPath);
  } catch (e) {}

  taskLogger.info(`Generated output for ${task.id}: ${mtas.length} files included`);
}

export { SpeechDataTask };
