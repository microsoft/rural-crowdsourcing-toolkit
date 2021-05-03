// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Handlers for all the karya file related routes

import { KaryaMiddleware, KaryaRouteState } from '../KoaContextState';
import * as HttpResponse from '@karya/http-response';
import { envGetString } from '@karya/misc-utils';
import {
  BasicModel,
  KaryaFileRecord,
  LanguageCode,
  languageCodes,
  BlobParameters,
  getBlobName,
  MicrotaskAssignmentRecord,
  MicrotaskRecord,
  KaryaFile,
} from '@karya/common';
import fs from 'fs';

export type KaryaFileGetRouteState = KaryaRouteState<{
  karya_file: KaryaFileRecord;
}>;

type KaryaFileGetMiddleware = KaryaMiddleware<KaryaFileGetRouteState>;

/**
 * Check if language assets exist for a given language.
 * @param ctx Karya request context
 */
export const checkLanguageAssets: KaryaFileGetMiddleware = async (ctx, next) => {
  const language_code: LanguageCode = ctx.params.code;

  // Check if language code is valid
  if (!languageCodes.includes(language_code)) {
    HttpResponse.BadRequest(ctx, 'Missing or invalid language code');
    return;
  }

  try {
    // Get language asset file name
    const blobParams: BlobParameters = {
      cname: 'language-assets',
      language_code,
      ext: 'tgz',
    };
    const fileName = getBlobName(blobParams);

    // Set the karya file record
    ctx.state.karya_file = await BasicModel.getSingle('karya_file', {
      container_name: 'language-assets',
      name: fileName,
    });

    await next();
  } catch (e) {
    HttpResponse.NotFound(ctx, 'Requested language asset does not exist');
    return;
  }
};

/**
 * Check if input file exists for an assignment and if the user has access to
 * the assignment.
 * @param ctx Karya request context
 */
export const checkMicrotaskInputFile: KaryaFileGetMiddleware = async (ctx, next) => {
  const mta_id: string = ctx.params.id;

  // Get the microtask assignment
  let mta: MicrotaskAssignmentRecord;
  try {
    mta = await BasicModel.getSingle('microtask_assignment', { id: mta_id });
  } catch (e) {
    HttpResponse.NotFound(ctx, `Assignment with ID '${mta_id}' does not exist`);
    return;
  }

  // Check if user is indeed assigned the microtask assignment
  if (mta.worker_id != ctx.state.entity.id) {
    HttpResponse.Forbidden(ctx, 'User does not have access to assignment');
    return;
  }

  // Get the microtask
  let mt: MicrotaskRecord;
  try {
    mt = await BasicModel.getSingle('microtask', { id: mta.microtask_id });
  } catch (e) {
    // TODO: Convert this to internal server error
    HttpResponse.BadRequest(ctx, 'No microtask for assignment?');
    return;
  }

  // Check if microtask has an input file
  if (!mt.input_file_id) {
    HttpResponse.NotFound(ctx, 'No input file for microtask');
    return;
  }

  try {
    ctx.state.karya_file = await BasicModel.getSingle('karya_file', { id: mt.input_file_id });
    await next();
  } catch (e) {
    HttpResponse.NotFound(ctx, 'Could not locate input file record');
    return;
  }
};

/**
 * Get and return a karya file.
 * @param ctx Karya request context
 */
export const getFile: KaryaFileGetMiddleware = async (ctx) => {
  const local_folder = envGetString('LOCAL_FOLDER');
  const cname = ctx.state.karya_file.container_name;
  const fileName = ctx.state.karya_file.name;
  const filePath = `${process.cwd()}/${local_folder}/${cname}/${fileName}`;

  try {
    ctx.attachment(fileName);
    HttpResponse.OK(ctx, fs.createReadStream(filePath));
  } catch (e) {
    HttpResponse.NotFound(ctx, 'Requested file is not available');
  }
};

export type KaryaFileSubmitRouteState = KaryaRouteState<{
  karya_file: KaryaFile;
  filePath: string;
}>;

type KaryaFileSubmitMiddleware = KaryaMiddleware<KaryaFileSubmitRouteState>;

/**
 * Verify if request contains a file, and verify its checksum.
 * @param ctx Karya request context
 */
export const verifyFile: KaryaFileSubmitMiddleware = async (ctx, next) => {
  const { files } = ctx.request;
  if (!files || !files.file) {
    HttpResponse.BadRequest(ctx, 'No file attached for upload');
    return;
  }

  let karya_file: KaryaFile;
  try {
    karya_file = JSON.parse(ctx.request.body.data);
  } catch (e) {
    HttpResponse.BadRequest(ctx, 'Invalid JSON object');
    return;
  }

  const file = files.file;
  if (file instanceof Array) {
    HttpResponse.BadRequest(ctx, 'Cannot upload multiple files in a single request');
    return;
  }

  // Set file path
  ctx.state.filePath = file.path;

  // TODO: Compute and verify checksum

  // Set checksum and timestamp
  ctx.state.karya_file.algorithm = karya_file.algorithm;
  ctx.state.karya_file.checksum = karya_file.checksum;
  ctx.state.karya_file.timestamp = karya_file.timestamp;
  await next();
};

/**
 * Submit output file for an assignment
 * @param ctx Karya request context
 */
export const submitOutputFile: KaryaFileSubmitMiddleware = async (ctx, next) => {
  const mta_id: string = ctx.params.id;

  // Get the microtask assignment
  let mta: MicrotaskAssignmentRecord;
  try {
    mta = await BasicModel.getSingle('microtask_assignment', { id: mta_id });
  } catch (e) {
    HttpResponse.NotFound(ctx, `Assignment with ID '${mta_id}' does not exist`);
    return;
  }

  // Check if user is indeed assigned the microtask assignment
  if (mta.worker_id != ctx.state.entity.id) {
    HttpResponse.Forbidden(ctx, 'User does not have access to assignment');
    return;
  }

  const blobParams: BlobParameters = {
    cname: 'microtask-assignment-output',
    microtask_assignment_id: mta_id,
    ext: 'tgz',
  };

  ctx.state.karya_file = {
    ...ctx.state.karya_file,
    container_name: 'microtask-assignment-output',
    name: getBlobName(blobParams),
    creator: 'worker',
    creator_id: ctx.state.entity.id,
    in_box: true,
  };

  await next();
};

/**
 * Submit log file for a worker
 * @param ctx Karya request context
 */
export const submitLogFile: KaryaFileSubmitMiddleware = async (ctx, next) => {
  ctx.state.karya_file = {
    ...ctx.state.karya_file,
    container_name: 'worker-logs',
    creator: 'worker',
    creator_id: ctx.state.entity.id,
  };

  await next();
};

/**
 * Submit file
 * @param ctx Karya request context
 */
export const submitFile: KaryaFileSubmitMiddleware = async (ctx, next) => {
  try {
    const folder = envGetString('LOCAL_FOLDER');
    const { container_name, name } = ctx.state.karya_file;
    const destination = `${process.cwd()}/${folder}/${container_name}/${name}`;
    await fs.promises.copyFile(ctx.state.filePath, destination);

    // TODO: Check if upsert is needed
    const fileRecord = await BasicModel.insertRecord('karya_file', ctx.state.karya_file);
    HttpResponse.OK(ctx, fileRecord);
  } catch (e) {
    HttpResponse.BadRequest(ctx, 'Could not copy file');
  }
};
