// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * File that implements the interface for authorizatio related functions: signUp and verify
 */

/** Import necessary DB types */
import { AuthProviderType, WorkProvider, WorkProviderRecord } from '@karya/db';

/** Imporet types from auth interaface */
import {
  IDTokenVerificationResponse,
  UserSignUpResponse,
} from './common/AuthProviderInterface';

/** Basic model to work with DB tables */
import * as BasicModel from '../models/BasicModel';

/** List of auth providers */
import GoogleOauth2AP from './google-oauth-2/Index';

/** Response type for auth requests; id_token must be part of response */
export type AuthResponse =
  | { success: true; wp: WorkProviderRecord }
  | { success: false; message: string };

/**
 * Function to sign up a new user
 * @param authenticationMethod koa context object
 * @param authInfo contains user authorisation object
 * @returns returns the authorisation object
 */
export async function signUpUser(
  userInfo: WorkProvider,
): Promise<AuthResponse> {
  try {
    const authProvider = userInfo.auth_provider;
    const signUpResponse: UserSignUpResponse =
      authProvider === 'google_oauth'
        ? await GoogleOauth2AP.signUpUser(userInfo)
        : { success: false, message: 'Unsuported authentication type' };

    /** If signup response has failed, return immediately */
    if (signUpResponse.success === false) {
      return { success: false, message: signUpResponse.message };
    }

    /** Check if a previous work provider with the given credentials exists */
    const records = await BasicModel.getRecords(
      'work_provider',
      signUpResponse.matchInfo,
    );

    if (records.length > 0) {
      return {
        success: false,
        message: 'Credentials already used for a different work provider',
      };
    }

    /** Update the work provider record */
    const updatedWP = signUpResponse.userInfo;

    /** Cannot sign up an admin user via the web portal */
    delete updatedWP.admin;

    /** Run query to update */
    const updatedRecord = await BasicModel.updateSingle(
      'work_provider',
      { id: userInfo.id },
      updatedWP,
    );

    /** Successful update */
    return { success: true, wp: updatedRecord };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

/**
 * Function to verify the ID token received as part of HTTP request and retrive
 * the work provider corresponding to the match object
 * @param authProvider Auth provider type extracted from the request header
 * @param idToken ID token extracted from the request header
 */
export async function verifyIDToken(
  authProvider: AuthProviderType,
  idToken: string,
): Promise<AuthResponse> {
  try {
    const tokenResponse: IDTokenVerificationResponse =
      authProvider === 'google_oauth'
        ? await GoogleOauth2AP.verifyIDToken(idToken)
        : { success: false, message: 'Unsupported authentication type' };

    /** If token verification failed, then return immediately */
    if (tokenResponse.success === false) {
      return { success: false, message: tokenResponse.message };
    }

    /** Get the records with matching info */
    const records = await BasicModel.getRecords(
      'work_provider',
      tokenResponse.matchInfo,
    );

    /** If no work provider */
    if (records.length !== 1) {
      return { success: false, message: 'Invalid work provider information' };
    }

    /** Return the retrieved work provider */
    return { success: true, wp: records[0] };
  } catch (err) {
    return { success: false, message: err.message };
  }
}
