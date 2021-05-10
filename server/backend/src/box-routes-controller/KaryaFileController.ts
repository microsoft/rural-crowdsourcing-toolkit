// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Handler for karya file related routes with box

import { KaryaFileRecord } from '@karya/core';
import { BoxRouteMiddleware } from '../routes/BoxRoutes';
import * as HttpResponse from '@karya/http-response';
import { getChecksum } from '../models/KaryaFileModel';
import { BasicModel, uploadBlobFromFileWithName } from '@karya/common';

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

export const get: BoxRouteMiddleware = async (ctx, next) => {};

export const getLanguageAssets: BoxRouteMiddleware = async (ctx, next) => {};
