// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Handler for language related routes

import { UserRouteMiddleware } from '../routes/UserRoutes';
import * as HttpResponse from '@karya/http-response';
import { getBlobName, BlobParameters, LanguageCode, languageCodes } from '@karya/core';
import { BasicModel, getBlobSASURL } from '@karya/common';
import { promises as fsp } from 'fs';
import { upsertKaryaFile } from '../models/KaryaFileModel';

/**
 * Submit language asset
 */
export const submitLangAsset: UserRouteMiddleware = async (ctx) => {
  const languageCode: LanguageCode = ctx.params.code;
  const { files } = ctx.request;

  if (!files) {
    HttpResponse.BadRequest(ctx, 'No file submitted');
    return;
  }

  const file = files.file;
  if (!file || file instanceof Array) {
    HttpResponse.BadRequest(ctx, `Invalid asset file`);
    return;
  }

  // Check if language code is valid
  if (!languageCodes.includes(languageCode)) {
    HttpResponse.BadRequest(ctx, 'Invalid language code');
    return;
  }

  const blobParams: BlobParameters = {
    cname: 'language-assets',
    language_code: languageCode,
    ext: 'tgz',
  };
  const blobName = getBlobName(blobParams);

  let currentFileId: string | undefined = undefined;
  try {
    const currentRecord = await BasicModel.getSingle('karya_file', {
      container_name: 'language-assets',
      name: blobName,
    });
    currentFileId = currentRecord.id;
  } catch (e) {
    // no existing record
  }

  const karyaFile = await upsertKaryaFile(file.path, 'MD5', blobParams, currentFileId);
  karyaFile.url = getBlobSASURL(karyaFile.url!, 'r');
  HttpResponse.OK(ctx, karyaFile);
  await fsp.unlink(file.path);
};

/**
 * Get language asset files
 */
export const getLangAssets: UserRouteMiddleware = async (ctx) => {
  const records = await BasicModel.getRecords('karya_file', { container_name: 'language-assets' });
  records.forEach((r) => {
    if (r.url) {
      r.url = getBlobSASURL(r.url, 'r');
    }
  });
  HttpResponse.OK(ctx, records);
};
