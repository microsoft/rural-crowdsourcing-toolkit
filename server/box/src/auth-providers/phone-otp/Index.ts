// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/** The file implements the phone-otp auth provider interface */

import { Worker, WorkerRecord } from '@karya/common';
import { generateToken, verifyToken } from '../AuthUtils';
import { IAuthProvider, IDTokenVerificationResponse, UserSignUpResponse } from '../common/AuthProviderInterface';

// User signup function
async function signUpUser(userInfo: Worker, ccRecord: WorkerRecord): Promise<UserSignUpResponse> {
  // If no phone number, return
  if (!userInfo.phone_number) {
    return { success: false, message: 'Need phone number' };
  }

  // Check if the info matches the cc Record
  // @ts-ignore
  if (ccRecord.params.phone_number !== userInfo.phone_number) {
    return { success: false, message: 'Phone number mismatch' };
  }

  // get the ID token
  const updatedWorker = generateToken(ccRecord.id, userInfo);

  return {
    success: true,
    userInfo: updatedWorker,
    matchInfo: { phone_number: userInfo.phone_number },
  };
}

// Token verification function
async function verifyIDToken(idToken: string): Promise<IDTokenVerificationResponse> {
  return verifyToken(idToken);
}

/**
 * Refresh the ID token and return new worker record
 * @param worker Current worker record
 */
async function refreshIDToken(worker: WorkerRecord): Promise<WorkerRecord> {
  const updatedWorker = generateToken(worker.id, worker);
  worker.salt = updatedWorker.salt as string;
  worker.id_token = updatedWorker.id_token as string;
  return worker;
}

// PhoneOTPAP
const phoneOTPAP: IAuthProvider = {
  name: 'phone_otp',
  signUpUser,
  verifyIDToken,
  refreshIDToken,
};

export default phoneOTPAP;
