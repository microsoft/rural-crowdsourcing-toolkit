// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Handler for karya file related routes with box

import { KaryaFileRecord, getChecksum } from '@karya/core';
import { BoxRouteMiddleware } from '../routes/BoxRoutes';
import * as HttpResponse from '@karya/http-response';
import { BasicModel, getBlobSASURL, uploadBlobFromFileWithName } from '@karya/common';

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
    return;
  }

  // Upload file
  try {
    const blobURL = await uploadBlobFromFileWithName(fileRecord.container_name, fileRecord.name, file.path);

    fileRecord.url = blobURL;
    fileRecord.in_server = true;
    await BasicModel.upsertRecord('karya_file', fileRecord);
    HttpResponse.OK(ctx, {});
  } catch (e) {
    // Convert this to internal server error
    console.log(e);
    HttpResponse.BadRequest(ctx, 'Something went wrong while uploading');
    return;
  }
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
  try {
    const sasURL = getBlobSASURL(url, 'r', 120);
    karyaFile.url = sasURL;
    HttpResponse.OK(ctx, karyaFile);
  } catch (e) {
    HttpResponse.BadRequest(ctx, 'Unable to generate SAS token');
    return;
  }
};

/**
 * Get all langauge assets
 */
export const getLanguageAssets: BoxRouteMiddleware = async (ctx, next) => {};
