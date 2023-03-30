// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Version 0 of the access code generator.
//
// This version is a simple random code generator and expects the app to know
// the URL of the box it is accessing. Only the access code length information
// is embedded.

import { AccessCodeInfo, AccessCodeVersion } from '../Index';
import { intToBinaryString, randomBinaryString } from '../utils/Common';

/**
 * Generate an access code from the information
 * @param info Version 0 access code information
 */
export function generateV0Code(info: AccessCodeInfo): string {
  // Extract basic information
  const length = info.length;
  if (length > 16) throw new Error('Access code cannot be more than 16 digits');

  // Determine the number of random bits needed for the access code
  const totalLength = Math.floor(length * Math.log2(10));
  const headerLength = 6;

  // Determine and generate random info
  const randomLength = totalLength - headerLength;
  const randomInfo = randomBinaryString(randomLength);
  const lengthString = intToBinaryString(length - 1, 4);
  const versionString = intToBinaryString(AccessCodeVersion.V0, 2);
  const accessCodeBinaryString = randomInfo + lengthString + versionString;

  // Generate the integer access code
  const accessCodeInteger = Number.parseInt(accessCodeBinaryString, 2);
  return accessCodeInteger.toString(10).padStart(length, '0');
}

/**
 * Parse a V0 access code
 */
export function parseV0Code(accessCode: string): Partial<AccessCodeInfo> {
  // Convert access code to integer
  const accessCodeInt = Number.parseInt(accessCode);
  if (isNaN(accessCodeInt)) throw new Error('Access code is not an integer');

  // Extract version and length
  const accessCodeBinaryString = accessCodeInt.toString(2);
  const version = Number.parseInt(accessCodeBinaryString.slice(-2), 2);
  const length = Number.parseInt(accessCodeBinaryString.slice(-6, -2), 2) + 1;

  if (version != AccessCodeVersion.V0) throw new Error('Invalid access code version');
  if (accessCode.length != length) throw new Error('Incorrect access code length');

  return {
    version: AccessCodeVersion.V0,
    length,
  };
}
