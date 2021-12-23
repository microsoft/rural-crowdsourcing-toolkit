// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// This file implements a set of misc helper utilities.

import Crypto from 'crypto';
import CryptoJS from 'crypto-js';

/**
 * Helper utility generates a random creation code of a given length.
 * @param options length of the code; only numeric code
 * @returns Randomly generated creationcode
 */
export function getCreationCode(
  options: { length: number; numeric: boolean } = { length: 16, numeric: false }
): string {
  const { length, numeric } = options;
  const choice = numeric ? '0123456789' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  let creationCode = '';
  while (creationCode.length < length) {
    creationCode += choice[Math.floor(Math.random() * choice.length)];
  }

  return creationCode;
}

/**
 * Get a random base64 key of the given length
 */
export function randomKey(length: number) {
  return Crypto.randomBytes(length).toString('base64').slice(0, length);
}

/**
 * Get the value of an environment variable
 * @param key Key to access within env
 * @param defaultValue Default value if key not present
 * @returns The value of the environment variable
 */

export function envGetString(key: string, defaultValue?: string): string {
  const value = process.env[key] ?? defaultValue;
  if (value == undefined) throw new Error(`Undefined environment variable '${key}'`);
  return value;
}

export function envGetNumber(key: string, defaultValue?: number): number {
  const eV = process.env[key];
  const value = eV ? Number.parseInt(eV) : defaultValue;
  if (value == undefined) throw new Error(`Undefined environment variable '${key}'`);
  return value;
}

export function envGetBoolean(key: string, defaultValue?: boolean): boolean {
  const eV = process.env[key];
  const value = eV != undefined ? eV == 'true' : defaultValue;
  if (value == undefined) throw new Error(`Undefined environment variable '${key}'`);
  return value;
}

// Calculate MD5 hash
export function calculateHash(...args: String[]): string {
  // Concatenate all the strings
  let message = args.join()
  let hash = CryptoJS.MD5(JSON.stringify({ message }));
  // Convert to string
  return hash.toString()
}
