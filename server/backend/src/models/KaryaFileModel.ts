// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Handle Karya File specific tasks
 */

import { BasicModel, downloadBlob, uploadBlobFromFile } from '@karya/common';
import { ChecksumAlgorithm, getChecksum, KaryaFile, KaryaFileRecord, BlobParameters, getBlobName } from '@karya/core';
import { promises as fsp } from 'fs';
import tar from 'tar';

/**
 * Handler to upload a karya file to the blob store, create its checksum and add
 * it to the db.
 * @param path Local path to the file
 * @param csAlgo Checksum algorithm to use
 * @param blobParams Blob parameters
 * @param currentFileID ID of the current karya file record if it is there
 *
 * @returns inserted karya file record
 */
export async function upsertKaryaFile(
  path: string,
  csAlgo: ChecksumAlgorithm,
  blobParams: BlobParameters,
  currentFileID?: string | null
): Promise<KaryaFileRecord> {
  // Upload file to blob store
  const blobName = getBlobName(blobParams);
  const blobURL = await uploadBlobFromFile(blobParams, path);

  // Create checksum
  const checksum = await getChecksum(path, csAlgo);

  // Create karya file object
  const kf: KaryaFile = {
    name: blobName,
    url: blobURL,
    container_name: blobParams.cname,
    creator: 'SERVER',
    creator_id: '0',
    algorithm: csAlgo,
    checksum,
    in_server: true,
    in_box: false,
  };

  const upsertedRecord = currentFileID
    ? await BasicModel.updateSingle('karya_file', { id: currentFileID }, kf)
    : await BasicModel.insertRecord('karya_file', kf);
  return upsertedRecord;
}

/**
 * Download a karya file and extract it into a folder
 * @param id ID of the karya file
 * @param folder_path Path to the folder where the file should be extracted
 */
export async function downloadAndExtractKaryaFile(id: string, folder_path: string) {
  const kf = await BasicModel.getSingle('karya_file', { id });
  const tgzPath = `${folder_path}/${kf.name}`;
  await downloadBlob(kf.url!, tgzPath);
  await tar.x({ C: folder_path, file: tgzPath });
  await fsp.unlink(tgzPath);
}
