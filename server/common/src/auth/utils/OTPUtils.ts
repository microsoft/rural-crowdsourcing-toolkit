// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Module to help with all things OTP.

import axios from 'axios';
import { envGetString, envGetBoolean } from '@karya/misc-utils';
import { DbRecordType } from '@karya/core';
import { BasicModel } from '../../Index';
import Application from 'koa';
import * as HttpResponse from '@karya/http-response';

const ONE_DAY_IN_MILLIS: number = 10000

// 2Factor OTP config type
export type PhoneOTPConfig = {
  available: boolean;
  url: string;
  apiKey: string;
};

// Get OTP config from environment
export function getOTPConfig(): PhoneOTPConfig {
  return {
    available: envGetBoolean('PHONE_OTP_AVAILABLE'),
    url: envGetString('PHONE_OTP_URL'),
    apiKey: envGetString('PHONE_OTP_API_KEY'),
  };
}

// Set OTP config to environment
export function setOTPConfig(config: PhoneOTPConfig) {
  process.env.PHONE_OTP_AVAILABLE = 'true';
  process.env.PHONE_OTP_URL = config.url;
  process.env.PHONE_OTP_API_KEY = config.apiKey;
}

/**
 * Generate a random OTP and return it
 * @param length Length of the OTP
 */
export function generateOTP(length: number = 6) {
  const otp = Math.round((Math.random() * 0.9 + 0.1) * Math.pow(10, length));
  return otp.toString();
}

/**
 * Send OTP to a phone number
 * @param phone_number Phone number to which to send the OTP
 * @param otp OTP to be sent
 */
export async function sendOTP(phone_number: string, otp: string) {
  // Extract information from environment
  const templateUrl = envGetString('PHONE_OTP_URL');
  const apiKey = envGetString('PHONE_OTP_API_KEY');

  // Generate the url for otp request
  const url = templateUrl
    .replace('__API_KEY__', apiKey)
    .replace('__PHONE_NUMBER__', phone_number)
    .replace('__OTP__', otp)
    .replace('__TEMPLATE__', 'OTP_ENGLISH');

  // Send the request for OTP
  const response = await axios.get(url);
  if (response.data.Status != 'Success') {
    throw new Error('Unable to send OTP');
  }
}

// Expected state for OTP routes
export type OTPState<EntityType extends 'server_user' | 'worker'> = {
  phone_number: string;
  entity: DbRecordType<EntityType>;
};

/**
 * Generates a set of middlewares and route handlers to generate, resend, and
 * verify OTP sent to users.
 * @param entityType Name of the entity: server_user or worker
 */
export function OTPHandlerTemplate<EntityType extends 'server_user' | 'worker'>(entityType: EntityType) {
  // OTP middleware
  type OTPMiddleware = Application.Middleware<OTPState<EntityType>>;

  /**
   * Middleware to check if
   * 1) phone number is provided as part of the header,
   * 2) phone number is valid, and
   * 3) record not associated with a different phone number
   * @param ctx Karya request context
   */
  const checkPhoneNumber: OTPMiddleware = async (ctx, next) => {
    // Extract phone number from header
    const phone_number = ctx.request.header['phone-number'];

    // Check if phone number is valid
    if (!phone_number || phone_number instanceof Array) {
      HttpResponse.BadRequest(ctx, 'Missing or multiple phone numbers');
      return;
    }

    // Ensure that phone number is 10 digits
    if (!/^\d+$/.test(phone_number) || phone_number.length != 10) {
      HttpResponse.BadRequest(ctx, `Invalid phone number '${phone_number}'`);
      return;
    }

    // Check if record is already used by another phone number
    if (ctx.state.entity.reg_mechanism && ctx.state.entity.phone_number != phone_number) {
      HttpResponse.Forbidden(ctx, 'Record already used by another phone number');
      return;
    }

    ctx.state.phone_number = phone_number;
    await next();
  };

  /**
   * Generate OTP for the worker.
   * @param ctx Karya request context
   */
  const generate: OTPMiddleware = async (ctx, next) => {
    const entity = ctx.state.entity;
    const phone_number = ctx.state.phone_number;
    // Generate OTP for the worker
    const otp = "123456"
    const otp_generated_at = new Date().getTime();

    // Update worker record with otp
    // @ts-ignore Unclear why this error is occuring.
    await BasicModel.updateSingle(entityType, { id: entity.id }, { phone_number, otp, otp_generated_at });

    // TODO: Need to update generation time and handle rate limits

    // Send the otp
    try {
      // await sendOTP(phone_number, otp);
      HttpResponse.OK(ctx, {}); 
      await next();
    } catch (e) {
      HttpResponse.Unavailable(ctx, 'Could not send OTP');
    }
  };

  /**
   * Resend a previously generated OTP for the worker.
   * @param ctx Karya request context
   */
  const resend: OTPMiddleware = async (ctx, next) => {
    console.log("INSIDE RESEND MIDDLEWARE")
    const entity = ctx.state.entity;
    const phone_number = ctx.state.phone_number;
    const otp = entity.otp;

    // Check if OTP was sent to this phone number before
    if (!otp) {
      HttpResponse.BadRequest(ctx, 'OTP was never sent to worker');
      return;
    }

    // Send the otp
    try {
      // await sendOTP(phone_number, otp);
      HttpResponse.OK(ctx, {});
      await next();
    } catch (e) {
      HttpResponse.Unavailable(ctx, 'Could not send OTP');
    }
  };

  /**
   * Verify OTP for the worker.
   * @param ctx Karya request context
   */
  const verify: OTPMiddleware = async (ctx, next): Promise<boolean> => {
    const entity = ctx.state.entity;

    // Extract OTP from the header
    const otp = ctx.request.header['otp'];

    // Check if otp is valid
    if (!otp || otp instanceof Array) {
      HttpResponse.BadRequest(ctx, 'Missing or multiple OTPs');
      return false;
    }

    // Check if otp is not expired
    const curr_time = new Date().getTime()
    // @ts-ignore QUERY: WHY IS OTP_GENERATED OF TYPE ANY?
    if(curr_time - entity.otp_generated_at > ONE_DAY_IN_MILLIS) {
      // @ts-ignore: Unclear why this error is occuring.
      await BasicModel.updateSingle(entityType, { id: entity.id }, { otp: null });
      HttpResponse.Unauthorized(ctx, 'OTP EXPIRED')
      return false;
    }

    // If OTP is not valid, then unauthorized access
    if (otp != entity.otp) {
      HttpResponse.Unauthorized(ctx, 'Invalid OTP');
      return false;
    }

    // Clear OTP field
    // @ts-ignore: Unclear why this error is occuring.
    await BasicModel.updateSingle(entityType, { id: entity.id }, { otp: null });
    HttpResponse.OK(ctx, {});
    await next();
    return true;
  };

  return { generate, resend, verify, checkPhoneNumber };
}
