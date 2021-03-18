// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import IConfig from './IConfig';

const config: IConfig = {
  dbConfig: {
    host: 'localhost',
    user: 'karya',
    password: 'pg_karya',
    database: 'karyabox',
    port: 5432,
    ssl: false,
  },

  baseServerPort: 8000,

  serverUrl: 'http://localhost:5000',

  cronInterval: '*/10 * * * *',

  googleOAuthClientId: '',

  logConfig: {
    logFolder: `${process.cwd()}/logs`,
    archiveDatePattern: 'YYYY-MM',
    consoleLogLevel: 'info',
  },

  phoneOtp: {
    available: false,
    length: 6,
    url: '',
    apiKey: '',
  },

  creationCodeLength: 16,

  filesFolder: `${process.cwd()}/files`,

  maxCreditPerBatch: 500,
};

export default config;
