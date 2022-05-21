// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';
import * as fs from 'fs';
import { BasicModel, knex, setupDbConnection } from '@karya/common';
import { Box, BoxRecord } from '@karya/core';
import { envGetString, randomKey } from '@karya/misc-utils';

/** Main registration script */
(async () => {
  setupDbConnection();

  // Get box config file
  const boxConfigFile = process.argv[2];
  if (!boxConfigFile) {
    throw new Error('Need to provide box config file as an argument');
  }

  // Extract box config
  const configData = await fs.promises.readFile(boxConfigFile);
  const box: Box = dotenv.parse(configData);
  const access_code = box.access_code;
  delete box.access_code;

  // Generate random key for the box
  box.key = randomKey(32);

  // TODO: Validate box object

  // Check if access code is already registered
  try {
    await BasicModel.getSingle('box', { access_code });
    throw new Error('A box with the given access code is already registered');
  } catch (e) {
    // Box is not registered
  }

  // Register box with server
  const serverUrl = envGetString('BACKEND_SERVER_URL');
  const response = await axios.put<BoxRecord>(`${serverUrl}/api_box/register`, box, {
    headers: { 'access-code': access_code as string },
  });

  // Insert box locally
  const boxRecord = await BasicModel.insertRecord('box', response.data);
  return boxRecord;
})()
  .then((box) => {
    console.log(`Registered box successfully: ID = ${box.id}`);
  })
  .catch((e) => {
    console.log('Error: ', e.message);
    console.log('Script failed');
  })
  .finally(() => knex.destroy());
