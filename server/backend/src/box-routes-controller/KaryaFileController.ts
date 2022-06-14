// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Handler for karya file related routes with box

import { KaryaFileRecord, getChecksum } from '@karya/core';
import { BoxRouteMiddleware } from '../routes/BoxRoutes';
import * as HttpResponse from '@karya/http-response';
import { BasicModel, getBlobSASURL, uploadBlobFromFileWithName } from '@karya/common';
import { promises as fsp } from 'fs';

/**
 * Upload a file from a box to the server.
 */
export const upload: BoxRouteMiddleware = async (ctx, next) => {
  // Extract the file record from the request
  let fileRecord: KaryaFileRecord;
  try {
    fileRecord = JSON.parse(ctx.request.body.data);
  } catch (e) {
    HttpResponse.BadRequest(ctx, 'Invalid file record');
    return;
  }

  // Check if there is a file
  const { files } = ctx.request;
  const file = files?.file;
  if (!file || file instanceof Array) {
    HttpResponse.BadRequest(ctx, 'Invalid file attachment');
    return;
  }

  // Compute checksum
  const checksum = await getChecksum(file.path, fileRecord.algorithm);
  if (checksum != fileRecord.checksum) {
    HttpResponse.BadRequest(ctx, 'Invalid checksum');
    await fsp.unlink(file.path);
    return;
  }

  // Upload file
  const blobURL = await uploadBlobFromFileWithName(fileRecord.container_name, fileRecord.name, file.path);
  await fsp.unlink(file.path);

  fileRecord.url = blobURL;
  fileRecord.in_server = true;
  await BasicModel.upsertRecord('karya_file', fileRecord);
  HttpResponse.OK(ctx, {});
};

/**
 * Get SAS token for a karya file
 */
export const get: BoxRouteMiddleware = async (ctx, next) => {
  // Get karya file id from params
  const id = ctx.params.id;

  // Fetch karya file
  let karyaFile: KaryaFileRecord;
  try {
    karyaFile = await BasicModel.getSingle('karya_file', { id });
  } catch (e) {
    HttpResponse.NotFound(ctx, 'No karya file with given ID');
    return;
  }

  const url = karyaFile.url;
  if (!url) {
    HttpResponse.NotFound(ctx, 'File not uploaded to server yet');
    return;
  }

  // Generate SAS token
  const sasURL = getBlobSASURL(url, 'r', 120);
  karyaFile.url = sasURL;
  HttpResponse.OK(ctx, karyaFile);
};

/**
 * Get all langauge assets
 */
export const getLanguageAssets: BoxRouteMiddleware = async (ctx, next) => {
  const from = ctx.request.query.from || new Date(0).toISOString();

  // Check from field
  if (from instanceof Array) {
    HttpResponse.BadRequest(ctx, 'Multiple from fields in query');
    return;
  }

  const records = await BasicModel.getRecords(
    'karya_file',
    { container_name: 'language-assets' },
    [],
    [['last_updated_at', from, null]]
  );

  records.forEach((r) => {
    if (r.url) r.url = getBlobSASURL(r.url, 'r');
  });

  HttpResponse.OK(
    ctx,
    records.filter((r) => r.url != null)
  );
};
