// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// This file implements a set of misc helper utilities.

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
