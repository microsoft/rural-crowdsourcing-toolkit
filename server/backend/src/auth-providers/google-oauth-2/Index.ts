// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/** This file implements the google oauth2 auth provider interface. */

import { OAuth2Client } from 'google-auth-library';

import { WorkProvider } from '@karya/common';
import { IAuthProvider, IDTokenVerificationResponse, UserSignUpResponse } from '../common/AuthProviderInterface';
import { envGetString } from '@karya/misc-utils';

// user signup function
async function signUpUser(userInfo: WorkProvider): Promise<UserSignUpResponse> {
  // If no id_token is provided, return
  if (!userInfo.id_token) {
    return { success: false, message: `Auth mechanism needs ID token` };
  }
  try {
    const CLIENT_ID = envGetString('GOOGLE_CLIENT_ID');
    const idToken = userInfo.id_token;
    const client = new OAuth2Client(CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken,
      audience: CLIENT_ID,
    });

    const auth_id = ticket.getUserId() as string;
    userInfo.auth_id = auth_id;
    const matchInfo: WorkProvider = { auth_provider: 'google_oauth', auth_id };
    return { success: true, userInfo, matchInfo };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

/**
 * Function to verify the ID token received from a HTTP request and generate a
 * match object to fetch the work provider
 * @param idToken id_token received from the HTTP request
 */
async function verifyIDToken(idToken: string): Promise<IDTokenVerificationResponse> {
  try {
    const CLIENT_ID = envGetString('GOOGLE_CLIENT_ID');
    const client = new OAuth2Client(CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken,
      audience: CLIENT_ID,
    });

    const auth_id = ticket.getUserId() as string;
    const matchInfo: WorkProvider = { auth_provider: 'google_oauth', auth_id };
    return { success: true, matchInfo };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

const GoogleOauth2AP: IAuthProvider = {
  name: 'google_oauth',
  signUpUser,
  verifyIDToken,
};

export default GoogleOauth2AP;
