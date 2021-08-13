// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Version 1 of the embedded access code generator.
//
// In this version, an embedded access code has the following components.
// 1. Design version = 00
// 2. Length of the code
// 3. Box type
// 4. Environment
// 5. Embed mechanism
// 6. Information about URL
// 7. Random bits

import { readFileSync } from 'fs';
import { mainLogger } from '@karya/common';
import { AccessCodeInfo, AccessCodeVersion } from '../Index';
import { intToBinaryString, randomBinaryString } from '../utils/Common';

/**
 * V1 access code generator config. This version requires a public production
 * box to be either directly mapped or via a template.
 */
let V1Config:
  | {
      directs: string[];
      templates: string[];
    }
  | undefined = undefined;

// Load version 0 config file
try {
  const configFilePath = `${process.cwd()}/.AccessCodeV1.json`;
  V1Config = JSON.parse(readFileSync(configFilePath).toString());
} catch (e) {
  // Unable to load config
  mainLogger.info('V1 access code generator is unavailable');
}

// Code length
// Access code can either be 8 digits or 16 digits
enum CodeLength {
  EIGHT = 0b0,
  SIXTEEN = 0b1,
}

// Environment
// If the enviroment is dev/test, then the box URL is determined from a config
// file in the apk. If it is prod, then additional information is processed
// to generate the app URL.
enum Environment {
  DEV_TEST = 0b0,
  PROD = 0b1,
}

// Box type
// If box type is physical, then the box IP address is fixed. Else if it is
// virtual, the embed mechanism is used to determine the URL.
enum BoxType {
  PHYSICAL = 0b0,
  VIRTUAL = 0b1,
}

// Embed Mechanism
// If the embed mechanism is direct map, then a six bit-index is used to look
// into a table that will be shipped with the app. If it is generated, then it
// an additional 3-bit template and 6-bit ID is used to
enum EmbedMechanism {
  DIRECT_MAP = 0b0,
  GENERATED = 0b1,
}

/**
 * Generate an access code from the information
 * @param info Version 0 access code information
 */
export function generateV1Code(info: AccessCodeInfo): string {
  // If V1 config is not present, throw an error
  if (!V1Config) throw new Error('Cannot generate V1 access code. Config not present');
  const { directs, templates } = V1Config;

  // Extract basic information for V1 access code
  const length = info.length == 8 ? CodeLength.EIGHT : info.length == 16 ? CodeLength.SIXTEEN : undefined;
  const env = info.env == 'prod' ? Environment.PROD : Environment.DEV_TEST;
  const boxType = info.physical_box ? BoxType.PHYSICAL : BoxType.VIRTUAL;

  if (length == undefined) throw new Error('V1 supports only length 8 and 16');

  const { box_url } = info;

  // Extract mechanism
  let mechanism: EmbedMechanism | undefined = undefined;
  const directIndex = directs.indexOf(box_url);
  let templateIndex: number;
  let templateId: number;
  if (directIndex >= 0) {
    mechanism = EmbedMechanism.DIRECT_MAP;
  } else {
    let i = 0;
    for (const template of templates) {
      const pattern = template.replace('#', '(\\d+)');
      const re = new RegExp(pattern);
      const match = box_url.match(re);
      if (match) {
        templateIndex = i;
        templateId = Number.parseInt(match[1]);
        mechanism = EmbedMechanism.GENERATED;
        break;
      }
      i++;
    }
  }

  if (mechanism == undefined) throw new Error('No match for the current box');

  // Determine the number of random bits needed for the access code
  const totalLength = length == CodeLength.EIGHT ? 26 : 53;
  const headerLength = 6;

  let embedLength: number;
  let embedInfo: number = 0;

  // Determine the number of bits of embedded information to identify URL
  if (env == Environment.DEV_TEST || boxType == BoxType.PHYSICAL) {
    embedLength = 0;
  } else {
    if (mechanism == EmbedMechanism.DIRECT_MAP) {
      embedLength = 6;
      embedInfo = directIndex;
    } else {
      embedLength = 9;
      // @ts-ignore
      embedInfo = templateIndex * 64 + templateId;
    }
  }

  // Determine and generate random info
  const randomLength = totalLength - (headerLength + embedLength);
  const randomInfo = randomBinaryString(randomLength);
  const embedString = intToBinaryString(embedInfo, embedLength);
  const mechanismString = mechanism == 0 ? '0' : '1';
  const envString = env == 0 ? '0' : '1';
  const boxTypeString = boxType == 0 ? '0' : '1';
  const lengthString = length == 0 ? '0' : '1';
  const versionString = intToBinaryString(AccessCodeVersion.V1, 2);

  // Generate the integer access code
  const accessCodeBinaryString =
    randomInfo + embedString + mechanismString + envString + boxTypeString + lengthString + versionString;

  const accessCodeInt = Number.parseInt(accessCodeBinaryString, 2);
  return accessCodeInt.toString(10).padStart(info.length, '0');
}

/**
 * Parse a V1 access code and return the relevant access code information
 */
export function parseV1Code(accessCode: string): Partial<AccessCodeInfo> {
  // If V1 config is not present, throw an error
  if (!V1Config) throw new Error('Cannot parse V1 access code. Config not present');

  // Convert access code to integer
  const accessCodeInt = Number.parseInt(accessCode);
  if (isNaN(accessCodeInt)) throw new Error('Access code is not an integer');

  const length = accessCode.length == 8 ? CodeLength.EIGHT : accessCode.length == 16 ? CodeLength.SIXTEEN : undefined;
  if (length == undefined) throw new Error('Invalid access code length');
  const binaryLength = length == CodeLength.EIGHT ? 26 : 53;

  const accessCodeBinaryString = accessCodeInt.toString(2).padStart(binaryLength, '0');
  const header = Number.parseInt(accessCodeBinaryString.slice(-6), 2);

  const version = header & 3;
  const lengthInfo = (header >> 2) & 1;
  const boxType = (header >> 3) & 1;
  const env = (header >> 4) & 1;
  const mechanism = (header >> 5) & 1;

  // Perform basic checks
  if (version != AccessCodeVersion.V1) throw new Error('Invalid access code version');
  if (length != lengthInfo) throw new Error('Invalid access code length');

  // Basic object
  const response: Partial<AccessCodeInfo> = {
    version: AccessCodeVersion.V1,
    length: accessCode.length,
    physical_box: boxType == BoxType.PHYSICAL,
    env: env == Environment.DEV_TEST ? 'test' : 'prod',
  };

  // If box type is physical or environment is dev/test, there is no information
  // to be extracted
  if (boxType == BoxType.PHYSICAL || env == Environment.DEV_TEST) return response;

  // Check the mechanism
  const { directs, templates } = V1Config;
  if (mechanism == EmbedMechanism.DIRECT_MAP) {
    const index = Number.parseInt(accessCodeBinaryString.slice(-12, -6), 2);
    const box_url = directs[index];
    return { ...response, box_url };
  } else {
    const templateId = Number.parseInt(accessCodeBinaryString.slice(-12, -6), 2);
    const templateIndex = Number.parseInt(accessCodeBinaryString.slice(-15, -12), 2);
    const box_url = templates[templateIndex].replace('#', templateId.toString());
    return { ...response, box_url };
  }
}
