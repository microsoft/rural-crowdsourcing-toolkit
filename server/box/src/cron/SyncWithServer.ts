// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/** Function to execute sequence of steps to sync with the server */

import config from '../config/Index';
import logger from '../utils/Logger';
import { BasicModel } from '@karya/db';
import { downloadPendingKaryaFiles, getNewSASTokens } from './DownloadFilesFromBlobStore';
import { getUpdatesFromServer } from './GetUpdatesFromServer';
import { sendUpdatesToServer } from './SendUpdatesToServer';
import { uploadKaryaFilesToServer } from './UploadFilesToServer';

// Box info
import box_id from '../config/box_id';
import { SetBox, this_box } from '../config/ThisBox';

// HTTP Utils
import { GET, PUT } from './HttpUtils';

/**
 * Cron function to periodically synchronize with the server
 */
export async function syncWithServer() {
  try {
    // Ensure that the box is set
    await SetBox();

    // Checkin with the server
    try {
      logger.info(`Checking in with the server`);
      await PUT<{}, {}>('/rbox/checkin', {});
    } catch (e) {
      logger.info(`No connection to the server. Exiting cron job.`);
      return;
    }

    // Get the phone authentication info
    if (!this_box.physical) {
      logger.info(`Fetching phone authentication information`);
      try {
        const phoneOtp = await GET<{}, typeof config['phoneOtp']>('/rbox/phone-auth-info', {});
        config.phoneOtp = { ...phoneOtp };
        logger.info(`Phone auth available.`);
      } catch (e) {
        // Unable to fetch api_key
        // Leave it as unavailable
      }
    }

    // Upload files to server
    const sendTime = new Date().toISOString();
    logger.info(`Uploading karya files to the server`);
    const uploadStatus = await uploadKaryaFilesToServer();
    if (uploadStatus) {
      logger.info(`Upload stage successfully`);
    } else {
      logger.error(`There were errors in the upload stage`);
    }

    // Send all updates to the server
    logger.info(`Sending database updates to the server`);
    const sendStatus = await sendUpdatesToServer(sendTime);
    if (sendStatus) {
      await BasicModel.updateSingle('box', { id: box_id }, { last_sent_to_server_at: sendTime });
      logger.info(`Send stage finished successfully`);
    } else {
      logger.error(`Send stage failed with errors`);
    }

    // Get new SAS URLs for files
    logger.info(`Get SAS tokens for files with null URL`);
    await getNewSASTokens();

    // Receive new updates from the server
    const receiveTime = new Date().toISOString();
    logger.info(`Receiving database updates from the server`);
    const receiveStatus = await getUpdatesFromServer();
    if (receiveStatus) {
      await BasicModel.updateSingle('box', { id: box_id }, { last_received_from_server_at: receiveTime });
      logger.info(`Receive stage finished successfully`);
    } else {
      logger.error(`Receive stage failed with errors`);
    }

    // Download karya files from the blob store
    logger.info(`Downloading karya files from the database`);
    const downloadStatus = await downloadPendingKaryaFiles();
    if (downloadStatus) {
      logger.info(`Download stage finished successfully`);
    } else {
      logger.error(`Download stage failed with errors`);
    }
  } catch (e) {
    logger.error(`Uncaught exception while syncing with server`);
    logger.error(e.message);
  }
}
