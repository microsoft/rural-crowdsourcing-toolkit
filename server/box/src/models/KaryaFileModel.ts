// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Functions to handle box-local karya files
 */

import md5File from 'md5-file';
import { ChecksumAlgorithm } from '@karya/core';

/**
 * Compute the checksum for a file given the path and checksum algorithm
 * @param algo Checksum algorithm
 * @param filepath File path
 */
export async function getChecksum(filepath: string, algo: ChecksumAlgorithm) {
  switch (algo) {
    case 'md5':
      return md5File(filepath);
    default:
      ((obj: never) => {
        // Typescript check
      })(algo);
      throw new Error('Unknown checksum algorithm');
  }
}
