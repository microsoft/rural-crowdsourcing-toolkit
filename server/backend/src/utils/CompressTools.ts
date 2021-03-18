// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Helper utilities for data compression and decompression
 */

import { createReadStream, createWriteStream } from 'fs';
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

/**
 * Gunzip a file into another file
 */
export async function gunzipFile(input: string, output: string): Promise<void> {
  const inputStream = createReadStream(input);
  const outputStream = createWriteStream(output);
  const gunzip = zlib.createGunzip();

  return new Promise((resolve, reject) => {
    const op = inputStream.pipe(gunzip).pipe(outputStream);
    op.on('finish', () => resolve());
    op.on('error', err => reject(err));
  });
}
