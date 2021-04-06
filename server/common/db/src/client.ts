// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// This file defines the knex client that will be used to connect to the
// database. The setupDbConnection should be called before any database calls
// are made.

import knexPkg, { Knex } from 'knex';

let knex: Knex;

export function setupDbConnection(dbConfig: Knex.PgConnectionConfig) {
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
