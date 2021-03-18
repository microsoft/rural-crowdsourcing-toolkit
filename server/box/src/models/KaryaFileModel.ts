// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Functions to handle box-local karya files
 */

import { promises as fsp } from 'fs';
import md5File from 'md5-file';
import box_id from '../config/box_id';
import config from '../config/Index';
import {
  ChecksumAlgorithm,
  KaryaFile,
  KaryaFileRecord,
} from '../db/TableInterfaces.auto';
import * as BasicModel from '../models/BasicModel';
import { BlobParameters, getBlobName } from '../utils/BlobContainers';

/**
 * Insert a karya file created by the worker.
 * @param karyaFile Partial karya file record with checksum and algorithm
 * @param blobParams Parameters for the blob where the file will be uploaded
 * @param filepath Path of the file to be uploaded
 */
export async function insertWorkerFile(
  worker_id: number,
  karyaFile: KaryaFile,
  blobParams: BlobParameters,
  filepath: string,
): Promise<KaryaFileRecord> {
  if (!karyaFile.algorithm) {
    throw new Error('Need checksum with a file upload');
  }

  // Verify checksum
  const checksum = await getChecksum(filepath, karyaFile.algorithm);
  if (checksum !== karyaFile.checksum) {
    throw new Error('Checksum did not match.');
  }

  // Fill out the remaining details
  karyaFile.container_name = blobParams.cname;
  karyaFile.name = getBlobName(blobParams);
  karyaFile.creator = 'karya_client';
  karyaFile.worker_id = worker_id;
  karyaFile.box_id = box_id;
  karyaFile.in_box = true;

  // copy the file to the right location
  await fsp.copyFile(
    filepath,
    `${config.filesFolder}/${karyaFile.container_name}/${karyaFile.name}`,
  );

  // Insert the record into the db
  const fileRecord = await BasicModel.insertRecord('karya_file', karyaFile);
  return fileRecord;
}

/**
 * Insert a local file into the karya DB
 * @param path Local path to the file
 * @param blobParams Blob parameters
 *
 * @returns inserted karya file record
 */
export async function insertLocalKaryaFile(
  blobParams: BlobParameters,
  filepath: string,
): Promise<KaryaFileRecord> {
  const csAlgo: ChecksumAlgorithm = 'md5';

  // Get blob name
  const blobName = getBlobName(blobParams);

  // Create checksum
  const checksum = await getChecksum(filepath, csAlgo);

  // Copy file to the appropriate path
  await fsp.copyFile(
    filepath,
    `${config.filesFolder}/${blobParams.cname}/${blobName}`,
  );

  // Create karya file object
  const kf: KaryaFile = {
    name: blobName,
    box_id,
    container_name: blobParams.cname,
    creator: 'karya_box',
    algorithm: csAlgo,
    checksum,
    in_box: true,
  };

  const insertedRecord = await BasicModel.insertRecord('karya_file', kf);
  return insertedRecord;
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
