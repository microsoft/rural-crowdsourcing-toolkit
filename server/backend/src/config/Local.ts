// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import IConfig from './IConfig';

const config: IConfig = {
  name: 'local',

  azureKeyVault: null,

  serverPort: 5000,

  dbConfig: {
    host: 'localhost',
    user: 'karya',
    password: 'pg_karya',
    database: 'karya',
    port: 5432,
    ssl: false,
  },

  corsConfig: { origin: 'http://localhost:3000', credentials: true },

  cookieOptions: { httpOnly: true, maxAge: 60 * 60 * 1000 },

  logConfig: {
    logFolder: `${process.cwd()}/logs`,
    archiveDatePattern: 'YYYY-MM',
    consoleLogLevel: 'info',
  },

  creationCodeLength: 8,

  googleOAuthClientID: '',

  phoneOtp: {
    available: false,
    length: 6,
    url: '',
    apiKey: '',
  },

  blob: {
    account: 'karyav2test',
    key: process.env[`AZURE_KEY_karyav2test`] || '',
  },

  localFolder: `${process.cwd()}/local`,

  tempFolder: `${process.cwd()}/tmp`,
};

export default config;
