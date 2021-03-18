// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Helper utilities for data compression and decompression
 */

import * as zlib from 'zlib';

/**
 * Compress a piece of data using brotli compress
 * @param data Data to be compressed
 */
export async function compress(data: string): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    zlib.brotliCompress(data, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

/**
 * Decompress a piece of brotli compressed data
 * @param data Data to be decompressed
 */
export async function decompress(data: Buffer): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    zlib.brotliDecompress(data, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result.toString());
      }
    });
  });
}
