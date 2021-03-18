// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import knexPkg from 'knex';
import config from '../config/Index';

const options = {
  client: 'pg',
  connection: config.dbConfig,
  pool: {
    min: 2,
    max: 10,
  },
};

export const knex = knexPkg(options);
