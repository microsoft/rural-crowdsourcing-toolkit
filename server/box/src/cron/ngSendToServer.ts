// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Send files and information to the server

import { BasicModel } from '@karya/common';
import { BoxRecord, KaryaFileRecord } from '@karya/core';
import { envGetString } from '@karya/misc-utils';
import { Promise as BBPromise } from 'bluebird';
import FormData from 'form-data';
import { promises as fsp } from 'fs';
import { AxiosInstance } from 'axios';
import { cronLogger } from '../utils/Logger';

/**
 * Upload all karya files to the server
 * @param box Box record
 * @param axios Axios instance with defaults
 */
export async function uploadKaryaFilesToServer(box: BoxRecord, axios: AxiosInstance) {
  // Get all files that are yet to be uploaded to the server
  const files = await BasicModel.getRecords('karya_file', { box_id: box.id, in_box: true, in_server: false });

  // Local folder
  const localFolder = envGetString('LOCAL_FOLDER');
  const localFolderPath = `${process.cwd()}/${localFolder}`;

  // Failed list
  const fileNotFound: string[] = [];
  const failedUpload: string[] = [];

  cronLogger.info(`Need to upload ${files.length} files`);

  // Upload files
  await BBPromise.mapSeries(files, async (file) => {
    const path = `${localFolderPath}/${file.container_name}/${file.name}`;

    // Read the file
    let data: Buffer;
    try {
      data = await fsp.readFile(path);
    } catch (e) {
      // file not found
      fileNotFound.push(file.id);
      return;
    }

    // Create form data request
    const form = new FormData();
    form.append('data', JSON.stringify(file));
    form.append('file', data, { filename: file.name });

    // Upload file
    try {
      await axios.put<KaryaFileRecord>('/karya_file', form, { headers: form.getHeaders() });
      await BasicModel.updateSingle('karya_file', { id: file.id }, { in_server: true });
    } catch (e) {
      failedUpload.push(file.id);
    }
  });

  const failedCount = fileNotFound.length + failedUpload.length;
  if (failedCount > 0) {
    cronLogger.warn(`Failed to upload ${failedCount} files`);
  } else {
    cronLogger.info('Uploaded all files successfully');
  }
}
