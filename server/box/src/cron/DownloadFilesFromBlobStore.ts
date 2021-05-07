// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Download all karya files relevant for this box from the blob store into the
 * local storage.
 */

import axios from 'axios';
import BBPromise from 'bluebird';
import * as fs from 'fs';
import { KaryaFileRecord } from '@karya/core';
import { BasicModel } from '@karya/common';
import { getChecksum } from '../models/KaryaFileModel';
import logger from '../utils/Logger';
import { GET } from './HttpUtils';
import { envGetString } from '@karya/misc-utils';

/**
 * Download all pending karya files. These are files corresponding to records
 * that are in the server but not in the box.
 */
export async function downloadPendingKaryaFiles() {
  let status = true;

  try {
    // Extract all pending karya files. Those in the server but not in the box
    const pendingFiles = await BasicModel.getRecords('karya_file', {
      in_server: true,
      in_box: false,
    });

    logger.info(`Need to download ${pendingFiles.length} file(s)`);

    // Download each file
    await BBPromise.mapSeries(pendingFiles, async (karyaFile) => {
      try {
        // Need to request new SAS tokens for these files
        if (karyaFile.url === null) {
          return;
        }

        // Construct local file path
        // Local directories must have been created during server init
        const folder = envGetString('LOCAL_FOLDER');
        const filepath = `${process.cwd()}/${folder}/${karyaFile.container_name}/${karyaFile.name}`;

        // Download the file. On failure, reset the URL.
        try {
          await downloadKaryaFile(karyaFile.url, filepath);
        } catch (err) {
          throw new Error('Failed to download karya file');
        }

        // Get and check checksum
        const checksum = await getChecksum(filepath, karyaFile.algorithm);

        // If checksum does not match, then reset the URL.
        if (checksum !== karyaFile.checksum) {
          throw new Error('Checksum error');
        }

        // File downloaded successfully. Set the in_box field, reset URL.
        await BasicModel.updateSingle('karya_file', { id: karyaFile.id }, { in_box: true, url: null });
      } catch (err) {
        status = false;
        // Reset URL
        await BasicModel.updateSingle('karya_file', { id: karyaFile.id }, { url: null });
        logger.error(`Failed to download '${karyaFile.container_name}/${karyaFile.name}': ${err.message}`);
      }
    });
  } catch (err) {
    logger.error(`Uncaught exception in download stage: ${err.message}`);
    status = false;
  }

  return status;
}

/**
 * Function to get new SAS tokens for karya_files which have null URLs.
 */
export async function getNewSASTokens() {
  try {
    // Extract all pending karya files. Those in the server but not in the box
    const pendingFiles = await BasicModel.getRecords('karya_file', {
      in_server: true,
      in_box: false,
      url: null,
    });

    logger.info(`Need to get SAS tokens for ${pendingFiles.length} file(s)`);

    await BBPromise.map(pendingFiles, async (karyaFile) => {
      try {
        const response = await GET<{}, KaryaFileRecord>(`/rbox/karya-file/${karyaFile.id}`);
        await BasicModel.updateSingle('karya_file', { id: response.id }, { url: response.url });
      } catch (e) {
        logger.error(`Failed to get SAS token`);
      }
    });
  } catch (e) {
    logger.error(`Uncaught exception in get SAS token stage: ${e.message}`);
  }
}

/**
 * Download a Karya File using the URL into the target path.
 * @param url Blob URL of the karya file
 * @param filepath Local target path for downloaded file
 */
async function downloadKaryaFile(url: string, filepath: string) {
  const writer = fs.createWriteStream(filepath);
  const response = await axios.get(url, { responseType: 'stream' });
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}
