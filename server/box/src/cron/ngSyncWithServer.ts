// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Sync box with main server

import { BoxRecord } from '@karya/core';
import { axios } from './ngHttpUtils';
import { cronLogger } from '../utils/Logger';
import { BasicModel, PhoneOTPConfig, setOTPConfig } from '@karya/common';
import { uploadKaryaFilesToServer } from './ngSendToServer';
import { getMicrotasks, getNewSASTokens, getTaskAssignments, downloadPendingKaryaFiles } from './ngReceiveFromServer';

/**
 * Sync specified box with server
 */
export async function syncBoxWithServer(box: BoxRecord) {
  cronLogger.info(`Syncing box ${box.id} with server`);

  // set request header
  const headers = { 'karya-id-token': box.id_token };

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
    headers['karya-id-token'] = id_token;
  } catch (e) {
    cronLogger.warn('Failed to update box with renewed ID token. Continuing with old token');
  }

  // Set axios default header
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

  // Send newly created workers to server

  // Send all created/completed microtask (group) assignments

  // Get task assignments from the server
  await getTaskAssignments(box, axios);

  // Get all microtasks
  await getMicrotasks(box, axios);

  // Get new SAS tokens
  await getNewSASTokens(axios);

  // Download all pending files
  await downloadPendingKaryaFiles();
}
