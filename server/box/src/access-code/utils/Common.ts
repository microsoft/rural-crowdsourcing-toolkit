// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Common utility functions that will be useful for all versions

/**
 * Generate a k-bit random string
 */
export function randomBinaryString(k: number): string {
  let response: string = '';
  for (let i = 0; i < k; i++) {
    response += Math.random() < 0.5 ? '0' : '1';
  }
  return response;
}

/**
 * Convert an integer into a binary string of the given length
 */
export function intToBinaryString(val: number, length: number): string {
  return val.toString(2).padStart(length, '0');
}
