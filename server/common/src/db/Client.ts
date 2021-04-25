// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// This file defines the knex client that will be used to connect to the
// database. The setupDbConnection should be called before any database calls
// are made.

import knexPkg, { Knex } from 'knex';
import { envGetBoolean, envGetNumber, envGetString } from '@karya/misc-utils';

let knex: Knex;

export function setupDbConnection(argDbConfig?: Knex.PgConnectionConfig) {
  // Extract db config from env
  const dbConfig: Knex.PgConnectionConfig = argDbConfig ?? {
    host: envGetString('DB_HOST'),
    user: envGetString('DB_USER'),
    password: envGetString('DB_PASSWORD'),
    database: envGetString('DB_NAME'),
    port: envGetNumber('DB_PORT'),
    ssl: envGetBoolean('DB_SECURE'),
  };

  const options: Knex.Config = {
    client: 'pg',
    connection: dbConfig,
    pool: {
      min: 0,
      max: 10,
    },
  };
  knex = knexPkg(options);
}

export { knex };
