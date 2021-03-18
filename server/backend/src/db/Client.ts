// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as Knex from 'knex';
import config from '../config/Index';

// Setup knex options
const options: Knex.Config = {
  client: 'pg',
  connection: config.dbConfig,
  pool: {
    min: 0,
    max: 10,
  },
};

let knex: Knex;

// Connect to DB
export function setupDBConnection() {
  knex = Knex(options);
}

export { knex };
