// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Define the interaface that should be implemented for different auth
// providers.

import {
  AuthProviderType,
  Worker,
  WorkerRecord,
} from '../../db/TableInterfaces.auto';

/**
 * Response type for the verify user function.
 * success: Indicates if the user was successfully verified
 * userInfo: Same as the provider information, with a few other fields filled out
 * matchInfo: A match object to fetch a unique user from our DB
 * message: Message in case of failed verification
 */
export type UserSignUpResponse =
  | { success: true; userInfo: Worker; matchInfo: Worker }
  | { success: false; message: string };

export type IDTokenVerificationResponse =
  | { success: true; matchInfo: Worker }
  | { success: false; message: string; matchInfo?: Worker };

/** Auth provier interace  */
export interface IAuthProvider {
  // name of the auth provider
  name: AuthProviderType;

  // function to verify the supplied user information and fill out the remaining
  // fields of the auth object.
  signUpUser(
    userInfo: Worker,
    ccRecord: WorkerRecord,
  ): Promise<UserSignUpResponse>;

  // function to verify id_token
  verifyIDToken(id_token: string): Promise<IDTokenVerificationResponse>;

  // function to refresh id_token
  refreshIDToken(worker: WorkerRecord): Promise<WorkerRecord>;
}
