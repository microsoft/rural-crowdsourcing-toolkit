// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/** Helper to generate creation codes for work provider and box */

import config from '../config/Index';

/** Function to generate a new creation code */
export function getCreationCode(options?: { numeric: boolean }) {
  const { creationCodeLength } = config;
  const choice =
    options && options.numeric
      ? '0123456789'
      : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  let creationCode = '';
  while (creationCode.length < creationCodeLength) {
    creationCode += choice[Math.floor(Math.random() * choice.length)];
  }

  return creationCode;
}
