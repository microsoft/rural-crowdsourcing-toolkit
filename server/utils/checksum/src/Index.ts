// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Entry point for checksum module

import md5File from 'md5-file';

// Checksum Algorithm
const checksumAlgorithms = ['MD5'] as const;
export type ChecksumAlgorithm = typeof checksumAlgorithms[number];

/**
 * Compute the checksum for a file given the path and checksum algorithm
 * @param algo Checksum algorithm
 * @param filepath File path
 */
export async function getChecksum(filepath: string, algo: ChecksumAlgorithm) {
  switch (algo) {
    case 'MD5':
      return md5File(filepath);
    default:
      ((obj: never) => {
        // Typescript check
      })(algo);
      throw new Error('Unknown checksum algorithm');
  }
}
