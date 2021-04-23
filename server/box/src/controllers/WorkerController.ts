// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Implements additional APIs for the 'box' table that could not be auto
// implemented.

import { refreshIDToken, signUpUser } from '../auth-providers/Index';
import { generateOTP, sendOTP } from '../auth-providers/phone-otp/OTPUtils';
import { Worker, WorkerRecord, BasicModel } from '@karya/db';
import { getControllerError } from './ControllerErrors';
import * as HttpResponse from '@karya/http-response';
import logger, { requestLogger } from '../utils/Logger';
import { KaryaHTTPContext } from './KoaContextType';
import { envGetBoolean } from '@karya/misc-utils';

/**
 * Controller for simple checkin. No authentication.
 * @param ctx Koa context
 */
export async function checkIn(ctx: KaryaHTTPContext) {
  HttpResponse.OK(ctx, {});
  return;
}

/**
 * Check if a creation is code is valid and available. Respond with the
 * corresponding worker object if yes, else respond with NotFound
 * @param ctx Koa context
 */
export async function checkCreationCode(ctx: KaryaHTTPContext) {
  // Get creation code from params
  const creation_code: string = ctx.params.creation_code;

  // Check if there is a creation code
  // May be unnecessary based on the koa operation
  if (!creation_code) {
    HttpResponse.BadRequest(ctx, 'Need a creation code');
    return;
  }

  // Check if a creation code record exist
  try {
    await BasicModel.getSingle('worker', { creation_code });
  } catch (e) {
    HttpResponse.OK(ctx, { valid: false, message: 'invalid_creation_code' });
    return;
  }

  // Check if creation code is already in use
  /* if (worker.auth_provider) {
    HttpResponse.OK(ctx, {
      valid: false,
      message: 'creation_code_already_used',
    });
    return;
  } */

  // Respond with the worker record
  HttpResponse.OK(ctx, { valid: true });
}

/**
 * Controller to initiate phone authentication for a worker
 * @param ctx Koa context
 */
export async function initiatePhoneAuthentication(ctx: KaryaHTTPContext) {
  // Extract worker object from the body
  const worker: Worker = ctx.request.body;

  // Check if the creation code is valid
  if (!worker.creation_code) {
    HttpResponse.BadRequest(ctx, 'Need to provide creation code');
    return;
  }

  // Check if the creation code is valid
  let workerRecord: WorkerRecord;
  try {
    workerRecord = await BasicModel.getSingle('worker', {
      creation_code: worker.creation_code,
    });
  } catch (e) {
    HttpResponse.NotFound(ctx, 'invalid_creation_code');
    return;
  }

  // Ensure that the creation code is not in use
  if (workerRecord.auth_provider && worker.phone_number != workerRecord.phone_number) {
    HttpResponse.Unavailable(ctx, 'creation_code_already_used');
    return;
  }

  const phone_number = worker.phone_number;

  // Check that there is a phone number
  if (!phone_number) {
    HttpResponse.BadRequest(ctx, 'Need to provide a phone number');
    return;
  }

  // If phone auth is not available, return
  const phoneOTPAvailable = envGetBoolean('PHONE_OTP_AVAILABLE', false);
  if (!phoneOTPAvailable && !phone_number.startsWith('00000')) {
    HttpResponse.Unavailable(ctx, 'Phone authentication is currently not available');
    return;
  }

  // Validate the phone number
  if (!/^\d+$/.test(phone_number) || phone_number.length !== 10) {
    HttpResponse.BadRequest(ctx, `Invalid phone number ${phone_number}`);
    return;
  }

  // Check if the phone number is already in use
  /* try {
    const phoneNumberRecord = await BasicModel.getSingle('worker', {
      phone_number,
    });
    if (phoneNumberRecord.auth_provider) {
      HttpResponse.BadRequest(ctx, 'phone_number_already_used');
      return;
    }
  } catch (e) {
    // Phone number not in use, continue
  } */

  try {
    // generate the OTP
    let otp: string;
    if (ctx.query.resend) {
      const params = workerRecord.params as {
        phone_number: string;
        otp: string;
      };
      if (!params.otp && params.phone_number !== phone_number) {
        HttpResponse.BadRequest(ctx, 'OTP was not sent to this phone');
        return;
      }
      otp = params.otp;
    } else {
      otp = generateOTP();

      if (phone_number.startsWith('00000')) {
        otp = '123456';
      }

      // Update the record params with phone_number and otp
      workerRecord = await BasicModel.updateSingle(
        'worker',
        { id: workerRecord.id },
        { params: { ...workerRecord.params, phone_number, otp } }
      );
    }

    // Send the otp
    if (!phone_number.startsWith('00000')) {
      await sendOTP(phone_number, otp);
    }

    workerRecord.profile_picture = null;

    // Respond with the record
    HttpResponse.OK(ctx, workerRecord);
  } catch (e) {
    requestLogger.error(e);
    HttpResponse.Unavailable(ctx, 'Failed to send OTP');
    return;
  }
}

/**
 * Update a worker with creation code
 * @param ctx koa context object
 */
export async function updateWorkerWithCreationCode(ctx: KaryaHTTPContext) {
  const workerInfo: Worker = ctx.request.body;
  let ccRecord: WorkerRecord;

  /** Check if the creation code is valid */
  try {
    const { creation_code } = workerInfo;
    ccRecord = await BasicModel.getSingle('worker', { creation_code });
  } catch (e) {
    logger.error('Invalid creation code');
    HttpResponse.BadRequest(ctx, 'invalid_creation_code');
    return;
  }

  /** Creation code already used check */
  /* if (ccRecord.auth_provider !== null) {
    logger.error('Creation code already in use');
    HttpResponse.BadRequest(ctx, 'creation_code_already_used');
    return;
  } */

  try {
    /** Sign up the user */
    const authResponse = await signUpUser(workerInfo, ccRecord);

    /** Set response based on status */
    if (authResponse.success === true) {
      logger.info('worker authentication success');
      // Set the cookie with id_token
      const worker = authResponse.wp;
      // assert that the auth_provider and id_token are not null
      worker.salt = null;
      worker.profile_picture = null;
      HttpResponse.OK(ctx, worker);
    } else {
      logger.error('worker authentication failed');
      HttpResponse.Unauthorized(ctx, authResponse.message);
    }
  } catch (e) {
    const message = getControllerError(e);
    HttpResponse.GenericError(ctx, message);
  }
}

/**
 * Refresh a worker ID token and sent new token
 * @params ctx Karya koa context
 */
export async function refreshIdToken(ctx: KaryaHTTPContext) {
  const workerRecord = ctx.state.current_user;
  requestLogger.info({ info: 'refresh token', id: workerRecord.id });
  requestLogger.info({
    oldSalt: workerRecord.salt,
    oldToken: workerRecord.id_token,
  });
  try {
    const updatedRecord = await refreshIDToken(workerRecord);
    updatedRecord.salt = null;
    updatedRecord.profile_picture = null;
    HttpResponse.OK(ctx, updatedRecord);
  } catch (e) {
    const message = getControllerError(e);
    HttpResponse.GenericError(ctx, message);
  }
}
