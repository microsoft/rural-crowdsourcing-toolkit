// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Sync box with main server

import { BoxRecord } from '@karya/core';
import { axios } from './HttpUtils';
import { cronLogger } from './Cron';
import { BasicModel, PhoneOTPConfig, setOTPConfig } from '@karya/common';
import {
  refreshMatViews,
  sendCompletedAssignments,
  sendNewAssignments,
  sendNewWorkers,
  sendUpdatedWorkers,
  uploadKaryaFilesToServer,
} from './SendToServer';
import {
  getMicrotasks,
  getNewSASTokens,
  getTaskAssignments,
  downloadPendingKaryaFiles,
  getUpdatedWorkers,
  getVerifiedAssignments,
  getLanguageAssets,
} from './ReceiveFromServer';

/**
 * Sync specified box with server
 */
export async function syncBoxWithServer(box: BoxRecord) {
  cronLogger.info(`Syncing box ${box.id} with server`);

  // set request header
  const headers = { 'karya-id-token': box.id_token as string };

  // Renew ID token
  let newBoxRecord: BoxRecord;
  try {
    cronLogger.info('Renewing box token');
    const response = await axios.get<BoxRecord>('/renew-token', { headers });
    newBoxRecord = response.data;
  } catch (e) {
    // No connection to server. Quit cron job.
    cronLogger.info('No connection to server');
    return;
  }

  // Update box record with new id token
  try {
    const { id, id_token } = newBoxRecord;
    await BasicModel.updateSingle('box', { id }, { id_token });
    headers['karya-id-token'] = id_token as string;
  } catch (e) {
    cronLogger.warn('Failed to update box with renewed ID token. Continuing with old token');
  }

  // Set axios default header
  // @ts-ignore
  axios.defaults.headers = headers;

  // Check if OTP service is available
  if (!box.physical) {
    try {
      const response = await axios.get<PhoneOTPConfig>('/phone-auth');
      const otpConfig = response.data;
      if (!otpConfig.available) {
        throw new Error('OTP service is not available');
      }
      setOTPConfig(otpConfig);
      cronLogger.info('OTP service is available');
    } catch (e) {
      cronLogger.warn('OTP service is not available');
      process.env.PHONE_OTP_AVAILABLE = 'false';
    }
  }

  // Upload files to the server
  await uploadKaryaFilesToServer(box, axios);

  // Send newly created workers and updated workers to server
  await sendNewWorkers(box, axios);
  await sendUpdatedWorkers(box, axios);

  // Send all created/completed microtask (group) assignments
  await sendNewAssignments(box, axios);
  await sendCompletedAssignments(box, axios);

  // Get language assets
  await getLanguageAssets(axios);

  // Get workers with updated tag information
  await getUpdatedWorkers(axios);

  // Get task assignments from the server
  await getTaskAssignments(box, axios);

  // Get all microtasks
  await getMicrotasks(box, axios);

  // Get new SAS tokens
  await getNewSASTokens(axios);

  // Download all pending files
  await downloadPendingKaryaFiles();

  // Get verified assignments
  await getVerifiedAssignments(box, axios);

  // Refresh mat views
  await refreshMatViews(axios);

  // Log for successful completion of sync
  cronLogger.info(`Completed sync for box ${box.id}`);
}
