// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Options as CorsOptions } from '@koa/cors';
import { SetOption as CookieOptions } from 'cookies';
import { Knex } from 'knex';

export default interface IConfig {
  // Name
  name: string;

  // Azure key-vault name if used to store secrets
  azureKeyVault: string | null;

  // web server config
  serverPort: number;

  // Config for the postgres database server
  dbConfig: Knex.PgConnectionConfig & { password: string };

  // CORS config
  corsConfig: CorsOptions;

  // Cookie options
  cookieOptions: CookieOptions;

  // config for logger
  logConfig: {
    logFolder: string;
    archiveDatePattern: string;
    consoleLogLevel: 'info' | 'error' | 'warn';
  };

  creationCodeLength: number;

  // Google credentials
  googleOAuthClientID: string;

  // Phone OTP config
  phoneOtp: {
    available: boolean;
    url: string;
    apiKey: string;
    length: number;
  };

  // blob config
  blob: {
    account: string;
    key: string;
  };

  // local folder for containers
  localFolder: string;

  // temporary folder
  tempFolder: string;
}
