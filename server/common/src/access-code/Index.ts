// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { BoxRecord, LanguageCode, WorkerRecord, Worker } from '@karya/core';
import { BasicModel } from '../Index';
import { generateV0Code, parseV0Code } from './versions/V0';
import { generateV1Code, parseV1Code } from './versions/V1';

// Embedded access code generator. This module will generate access codes that
// embed, among other things, information about the box that generated that
// code. To be future proof, each embedded access code includes a 2-bit design
// version that allows for extending to other formats.

// Access code version
export enum AccessCodeVersion {
  V0 = 0b00,
  V1 = 0b01,
  V2 = 0b10,
  V3 = 0b11,
}

export type AccessCodeInfo = {
  version?: AccessCodeVersion;
  length: number;
  env: 'dev' | 'test' | 'prod';
  physical_box: boolean;
  box_url: string;
  server_url: string;
};

// Current access code version
const CURRENT_VERSION = AccessCodeVersion.V0;

/**
 * Generate an access code with the given parameters
 * @param info Information regarding the access code to be generated
 */
export function generateAccessCode(info: AccessCodeInfo): string {
  const version = info.version ?? CURRENT_VERSION;
  switch (version) {
    case AccessCodeVersion.V0:
      return generateV0Code(info);
    case AccessCodeVersion.V1:
      return generateV1Code(info);
    default:
      throw new Error('Only versions 0 and 1 are supported now');
  }
}

/**
 * Parse an embedded access code
 */
export function parseAccessCode(accessCode: string): Partial<AccessCodeInfo> {
  const accessCodeInt = Number.parseInt(accessCode);
  if (isNaN(accessCodeInt)) throw new Error('Access code is not an integer');

  const version = accessCodeInt & 3;
  switch (version) {
    case AccessCodeVersion.V0:
      return parseV0Code(accessCode);
    case AccessCodeVersion.V1:
      return parseV1Code(accessCode);
    default:
      throw new Error('Only versions 0 and 1 are supported now');
  }
}

/**
 * Helper function to generate a number of access codes with a specified set of
 * tags, language, and access code version. Returns a set of worker records for
 * the created access codes.
 */
export async function generateWorkerCodes(
  box: BoxRecord,
  numCodes: number,
  language: LanguageCode,
  accessCodeInfo: AccessCodeInfo,
  tags: string[],
  wgroup: string | null = null
): Promise<WorkerRecord[]> {
  // Repeat for num_cc times
  const newWorkers: WorkerRecord[] = [];
  while (newWorkers.length < numCodes) {
    // Get a new acess code
    let access_code: string = '';

    while (true) {
      try {
        access_code = generateAccessCode(accessCodeInfo);
        await BasicModel.getSingle('worker', { access_code });
      } catch (e) {
        // access code does not exist.
        break;
      }
    }

    // Generate a worker record
    const now = new Date().toISOString();
    const createWorker: Worker = {
      access_code,
      box_id: box.id,
      language,
      tags: { tags },
      tags_updated_at: now,
      wgroup,
    };

    try {
      const workerRecord = await BasicModel.insertRecord('worker', createWorker);
      newWorkers.push(workerRecord);
    } catch (e) {
      break;
    }
  }

  return newWorkers;
}
