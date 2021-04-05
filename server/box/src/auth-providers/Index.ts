// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * File that implements the interface for authorizatio related functions: signUp and verify
 */

/** Import necessary DB types */
import {
  AuthProviderType,
  Worker,
  WorkerRecord,
} from '@karya/db';

/** Import types from auth interaface */
import {
  IDTokenVerificationResponse,
  UserSignUpResponse,
} from './common/AuthProviderInterface';

/** Basic model to work with DB tables */
import * as BasicModel from '../models/BasicModel';

/** List of auth providers */
import logger, { requestLogger } from '../utils/Logger';
import GoogleOauth2AP from './google-oauth-2/Index';
import PhoneOTPAP from './phone-otp/Index';

/** Response type for auth requests; id_token must be part of response */
export type AuthResponse =
  | { success: true; wp: WorkerRecord }
  | { success: false; message: string; wp?: Worker };

export async function signUpUser(
  userInfo: Worker,
  ccRecord: WorkerRecord,
): Promise<AuthResponse> {
  try {
    const authProvider = userInfo.auth_provider;

    if (!authProvider) {
      return { success: false, message: 'No authentication type information' };
    }

    const signUpResponse: UserSignUpResponse = await (async (
      ap: AuthProviderType,
    ) => {
      switch (ap) {
        case 'google_oauth':
          return GoogleOauth2AP.signUpUser(userInfo, ccRecord);
        case 'phone_otp':
          return PhoneOTPAP.signUpUser(userInfo, ccRecord);
        default:
          ((obj: never) => {})(ap);
          return {
            success: false as false,
            message: 'Unsupported authentication type',
          };
      }
    })(authProvider);

    /** If signup response has failed, return immediately */
    if (signUpResponse.success === false) {
      logger.error(`User signup reponse failed with ${signUpResponse.message}`);
      return { success: false, message: signUpResponse.message };
    }

    /** Check if a previous worker with the given credentials exists */
    /*const records = await BasicModel.getRecords(
      'worker',
      signUpResponse.matchInfo,
    );

    if (records.length > 0) {
      logger.error('Credentials already used for a different worker');
      return {
        success: false,
        message: 'Credentials already used for a different worker',
      };
    }*/

    /** Update the worker record */
    const updatedWP = signUpResponse.userInfo;

    /** Run query to update */
    const eon = new Date(0).toISOString();
    const updatedRecord = await BasicModel.updateSingle(
      'worker',
      { id: ccRecord.id },
      {
        ...updatedWP,
        last_received_from_box_at: eon,
        last_received_from_server_at: eon,
        last_sent_to_box_at: eon,
        last_sent_to_server_at: eon,
      },
    );

    /** Successful update */
    return { success: true, wp: updatedRecord };
  } catch (err) {
    logger.error(
      `Sign up authentication validation failed with error ${err.toString()}`,
    );
    return { success: false, message: err.message };
  }
}

/**
 * Function to verify the ID token received as part of HTTP request and retrieve
 * the worker corresponding to the match object
 * @param authProvider Auth provider type extracted from the request header
 * @param idToken ID token extracted from the request header
 */
export async function verifyIDToken(
  authProvider: AuthProviderType,
  idToken: string,
): Promise<AuthResponse> {
  try {
    const tokenResponse: IDTokenVerificationResponse = await (async (
      ap: AuthProviderType,
    ) => {
      switch (ap) {
        case 'google_oauth':
          return GoogleOauth2AP.verifyIDToken(idToken);
        case 'phone_otp':
          return PhoneOTPAP.verifyIDToken(idToken);
        default:
          ((obj: never) => {})(ap);
          return {
            success: false as false,
            message: 'Unknown authentication type',
          };
      }
    })(authProvider);

    /** If token verification failed, then return immediately */
    if (tokenResponse.success === false) {
      return {
        success: false,
        message: tokenResponse.message,
        wp: tokenResponse.matchInfo,
      };
    }

    /** Get the records with matching info */
    const records = await BasicModel.getRecords(
      'worker',
      tokenResponse.matchInfo,
    );

    /** If no worker */
    if (records.length !== 1) {
      return { success: false, message: 'Invalid worker information' };
    }

    /** Return the retrieved worker */
    return { success: true, wp: records[0] };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

/**
 * Refresh the ID token of a worker and return the new worker record.
 * @param worker Current worker record
 */
export async function refreshIDToken(
  worker: WorkerRecord,
): Promise<WorkerRecord> {
  // Get updated worker record
  const refreshedRecord = await (async (ap: AuthProviderType) => {
    switch (ap) {
      case 'google_oauth':
        return GoogleOauth2AP.refreshIDToken(worker);
      case 'phone_otp':
        return PhoneOTPAP.refreshIDToken(worker);
      default:
        ((obj: never) => {
          throw new Error('Unknown auth provider');
        })(ap);
    }
  })(worker.auth_provider as AuthProviderType);

  // Update the db
  const { id, last_updated_at, created_at, ...rest } = refreshedRecord;
  requestLogger.info({
    newSalt: refreshedRecord.salt,
    newToken: refreshedRecord.id_token,
  });
  const updatedRecord = await BasicModel.updateSingle('worker', { id }, rest);

  return updatedRecord;
}
