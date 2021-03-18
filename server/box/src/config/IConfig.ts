// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

export default interface IConfig {
  // Config for the postgres database server
  dbConfig: {
    host: string;
    user: string;
    password: string;
    database: string;
    port: number;
    ssl: boolean;
  };

  // Web server port
  baseServerPort: number;

  creationCodeLength: number;
  serverUrl: string;
  cronInterval: string;
  googleOAuthClientId: string;

  // Phone OTP config
  phoneOtp: {
    available: boolean;
    url: string;
    apiKey: string;
    length: number;
  };

  // config for logger
  logConfig: {
    logFolder: string;
    archiveDatePattern: string;
    consoleLogLevel: 'info' | 'error' | 'warn';
  };

  // local folder for blob containers
  filesFolder: string;

  // Max credits per batch
  maxCreditPerBatch: number;
}
