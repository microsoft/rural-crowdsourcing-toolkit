// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Handle Karya File specific tasks
 */

import md5File from 'md5-file';
import { ChecksumAlgorithm, KaryaFile, KaryaFileRecord, BasicModel } from '@karya/db';
import { BlobParameters, getBlobName, uploadBlobFromFile } from '@karya/blobstore';

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
    creator: 'karya_server',
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
 * Compute the checksum for a file given the path and checksum algorithm
 * @param algo Checksum algorithm
 * @param filepath File path
 */
export async function getChecksum(filepath: string, algo: ChecksumAlgorithm) {
  switch (algo) {
    case 'md5':
      return md5File(filepath);
    default:
      ((obj: never) => {
        // Typescript check
      })(algo);
      throw new Error('Unknown checksum algorithm');
  }
}
