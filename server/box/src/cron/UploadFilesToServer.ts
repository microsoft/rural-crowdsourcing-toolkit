// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Upload all karya files to the server
 */

import { Promise as BBPromise } from 'bluebird';
import FormData from 'form-data';
import { promises as fsp } from 'fs';
import box_id from '../config/box_id';
import config from '../config/Index';
import { KaryaFileRecord, BasicModel } from '@karya/db';
import logger from '../utils/Logger';
import { BackendFetch } from './HttpUtils';

/**
 * Upload all karya files to the server
 */
export async function uploadKaryaFilesToServer() {
  // Get all files created by this box that are not yet in the server
  const fileRecords = await BasicModel.getRecords('karya_file', {
    box_id,
    in_box: true,
    in_server: false,
  });

  logger.info(`Need to upload ${fileRecords.length} file(s)`);

  let status = true;

  // Upload all files
  await BBPromise.mapSeries(fileRecords, async (fileRecord) => {
    // Attempt to read file from local storage
    // TODO: Convert this to file stream
    const filepath = `${config.filesFolder}/${fileRecord.container_name}/${fileRecord.name}`;
    let fileData: Buffer;
    try {
      fileData = await fsp.readFile(filepath);
    } catch (e) {
      logger.error(`Karya file ${fileRecord.id} does not exist '${filepath}'`);
      status = false;
      return;
    }

    try {
      // Construct the form data
      const form = new FormData();
      form.append('data', JSON.stringify(fileRecord));
      form.append('file', fileData, {
        filename: fileRecord.name,
      });

      // Upload file to server
      const uploadedFileRecord = await BackendFetch<KaryaFileRecord>(`/rbox/upload-file`, {
        method: 'PUT',
        body: form.getBuffer(),
        headers: { ...form.getHeaders() },
      });

      // If successful, update the url and in_server state
      await BasicModel.upsertRecord('karya_file', uploadedFileRecord);
    } catch (e) {
      status = false;
      logger.error(`Failed to upload karya file ${fileRecord.id} (${filepath})`);
    }
  });

  return status;
}
