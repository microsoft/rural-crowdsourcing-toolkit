// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/** Utilities to generate and send OTP using 2factor.in */

import axios from 'axios';
import config from '../../config/Index';

/**
 * Generate a 6-digit OTP and return
 */
export function generateOTP(length: number = config.phoneOtp.length) {
  const otp = Math.round((Math.random() * 0.9 + 0.1) * Math.pow(10, length));
  return otp.toString();
}

/**
 * Send a given OTP to a given phone number
 * @param phone_number Phone number to send the OTP
 * @param otp OTP to be sent
 */
export async function sendOTP(phone_number: string, otp: string) {
  // Generate phone OTP url
  const url = config.phoneOtp.url
    .replace('__API_KEY__', config.phoneOtp.apiKey)
    .replace('__PHONE_NUMBER__', phone_number)
    .replace('__OTP__', otp)
    .replace('__TEMPLATE__', 'OTP_ENGLISH');

  // send request
  const response = await axios.get(url);
  if (response.data.Status !== 'Success') {
    throw new Error('Unable to send OTP');
  }
}
