// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Handler for language related routes

import { UserRouteMiddleware } from '../routes/UserRoutes';
import * as HttpResponse from '@karya/http-response';
import { envGetString } from '@karya/misc-utils';
import { getBlobName, BlobParameters, LanguageCode } from '@karya/core';
import { BasicModel, getBlobSASURL } from '@karya/common';
import { promises as fsp } from 'fs';
import { upsertKaryaFile } from '../models/KaryaFileModel';
import { Promise as BBPromise } from 'bluebird';

/**
 * Submit language asset
 */
export const submitLangAsset: UserRouteMiddleware = async (ctx) => {
  const langAsset = ctx.request.body;

  if (!langAsset.file) {
    HttpResponse.BadRequest(ctx, 'No file submitted');
    return;
  }

  if (langAsset.file instanceof Array) {
    HttpResponse.BadRequest(ctx, `Multiple files provided`);
    return;
  }

  // Copy the files to a temp folder
  const timestamp = new Date().toISOString();
  const uniqueName = `${langAsset.code}-${timestamp}`;
  const localFolder = envGetString('LOCAL_FOLDER');
  const folderPath = `${process.cwd()}/${localFolder}/language-assets/${uniqueName}`;

  try {
    await fsp.mkdir(folderPath);

    // Copy required file to destination
    const file = langAsset.file;
    const filePath: string = file.path;
    await fsp.copyFile(filePath, `${folderPath}/${uniqueName}.tgz`);
    await fsp.unlink(filePath);

    // Tar input blob parameter
    const inputBlobParams: BlobParameters = {
      cname: 'language-assets',
      language_code: langAsset.code as LanguageCode,
      ext: 'tgz',
    };
    const inputBlobName = getBlobName(inputBlobParams);
    const inputBlobPath = `${folderPath}/${inputBlobName}`;

    const record = await BasicModel.getSingle('karya_file', { name: `${langAsset.code}.tgz` });

    const karyaFile =
      record === undefined
        ? await upsertKaryaFile(inputBlobPath, 'MD5', inputBlobParams)
        : await upsertKaryaFile(inputBlobPath, 'MD5', inputBlobParams, record.id);

    // Return success response
    HttpResponse.OK(ctx, karyaFile);
  } catch (e) {
    // TODO: internal server error
    console.log(e);
    HttpResponse.BadRequest(ctx, 'Something went wrong');
    return;
  }
};

/**
 * Get language asset files
 */
export const getLangAssets: UserRouteMiddleware = async (ctx) => {
  const records = await BasicModel.getRecords('karya_file', { container_name: 'language-assets' });

  await BBPromise.mapSeries(records, async (r) => {
    if (r.url) {
      const url = getBlobSASURL(r.url, 'r');
      r.extras = { url };
    }
  });
  HttpResponse.OK(ctx, records);
};
