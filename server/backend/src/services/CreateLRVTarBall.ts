// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Handler to create LRV tarballs for languages and language resources.
 */

import { Promise as BBPromise } from 'bluebird';
import { promises as fs } from 'fs';
import * as tar from 'tar';

import {
  KaryaFileRecord,
  LanguageRecord,
  LanguageResourceRecord,
  LanguageResourceValueRecord,
  BasicModel,
} from '@karya/db';

import { upsertKaryaFile } from '../models/KaryaFileModel';

import { downloadBlob, getParts as getBlobParts } from '../utils/AzureBlob';
import { BlobParameters, getBlobName } from '@karya/blobstore';

import config from '../config/Index';
import logger from '../utils/Logger';

/**
 * Handler to create a tarball for all file language resources for a specific
 * language. This function must download all the blobs to a local directory,
 * create a tar ball and upload it back to the blob store. After uploading, the
 * function must update the lrv_file_id for the language record.
 * @param language Language for which tarball should be created
 */
export async function createLanguageLRVTarBall(language: LanguageRecord) {
  logger.info(`Creating LRV tar ball for language '${language.name}' (${language.id})`);

  // Get all the file language resources
  const lrRecords = await BasicModel.getRecords('language_resource', {
    type: 'file_resource',
  });
  const fileLRIDs = lrRecords.map((lr) => lr.id);

  // Get all valid file language resource values for the specific language
  const lrvRecords = await BasicModel.getRecordsWhereIn('language_resource_value', 'language_resource_id', fileLRIDs, {
    language_id: language.id,
    valid: true,
  });

  // temp folder for the language
  const folder = `${config.tempFolder}/language/${language.id}`;

  // blob params
  const llrvTarBlobParams: BlobParameters = {
    cname: 'l-lrvs',
    language_id: language.id,
    ext: 'tar',
  };

  const fileRecord = await createUpdateLRVTarBall(lrvRecords, folder, llrvTarBlobParams, language.lrv_file_id);

  // update the file link in the language record
  if (fileRecord !== null) {
    await BasicModel.updateSingle('language', { id: language.id }, { lrv_file_id: fileRecord.id });
  }
}

/**
 * Handler to create a tarball for a file language resource for all languages.
 * This function must download all the blobs to a local directory, create a tar
 * ball and upload it back to the blob store. After uploading, the function must
 * update the lrv_file_id for the language resource record.
 * @param language Language for which tarball should be created
 */

export async function createLanguageResourceLRVTarBall(lr: LanguageResourceRecord) {
  logger.info(`Creating LRV tar ball for language resource '${lr.name}' (${lr.id})`);

  // if resource is not a file resource, return immediately
  if (lr.type !== 'file_resource') {
    return;
  }

  // Get all valid language resource value records for the resource
  const lrvRecords = await BasicModel.getRecords('language_resource_value', {
    language_resource_id: lr.id,
  });

  // Create a temp folder for the lr
  const folder = `${config.tempFolder}/lr/${lr.id}`;

  // blob params
  const lrBlobParams: BlobParameters = {
    cname: 'lr-lrvs',
    language_resource_id: lr.id,
    ext: 'tar',
  };

  const fileRecord = await createUpdateLRVTarBall(lrvRecords, folder, lrBlobParams, lr.lrv_file_id);

  // If file was created, update the LR record with file ID
  if (fileRecord !== null) {
    await BasicModel.updateSingle('language_resource', { id: lr.id }, { lrv_file_id: fileRecord.id });
  }
}

async function createUpdateLRVTarBall(
  lrvRecords: LanguageResourceValueRecord[],
  folder: string,
  blobParams: BlobParameters,
  currentFileID: string | null
): Promise<KaryaFileRecord | null> {
  // Create the folder
  try {
    await fs.mkdir(folder, { recursive: true });
  } catch (e) {
    // Do nothing if folder already exists
    // TODO: check if this is some other perms error
  }

  // Download all the LRV files into the language folder
  const files = await BBPromise.map(lrvRecords, async (lrv) => {
    const blobURL = lrv.value;
    const { blobName } = getBlobParts(blobURL);
    const filepath = `${folder}/${blobName}`;
    // Unlink file if it exists
    try {
      await fs.unlink(filepath);
    } catch (e) {
      // File does not exist. Ignore exeption
    }
    await downloadBlob(blobURL, filepath);
    return blobName;
  });

  if (files.length > 0) {
    // create tar ball
    const tarName = getBlobName(blobParams);
    const tarPath = `${folder}/${tarName}`;
    await tar.c({ C: folder, file: tarPath }, files);

    // insert file record for tar ball
    const fileRecord = await upsertKaryaFile(tarPath, 'md5', blobParams, currentFileID);

    return fileRecord;
  }
  return null;
}
