// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import dotenv from 'dotenv';
dotenv.config();

import cors from '@koa/cors';
import { Promise as BBPromise } from 'bluebird';
import { promises as fsp } from 'fs';
import Koa from 'koa';
import { catchAll, httpRequestLogger, setupDbConnection } from '@karya/common';
import router, { authenticateRequest } from './routes/Routes';
import { containerNames } from '@karya/core';
import logger from './utils/Logger';
import { envGetNumber, envGetString } from '@karya/misc-utils';

// creates an instance of Koa app
const app = new Koa();

// app middleware
app.use(cors());
app.use(httpRequestLogger);
app.use(catchAll);
app.use(authenticateRequest);
app.use(router.allowedMethods());
app.use(router.routes());

// Main script to check for all dependencies and then start the box server.
(async () => {
  setupDbConnection();

  // Create all the local file folders
  logger.info(`Creating local folders for karya files`);
  const folder = envGetString('LOCAL_FOLDER');
  await BBPromise.mapSeries(containerNames, async (cname) => {
    try {
      await fsp.mkdir(`${process.cwd()}/${folder}/${cname}`, {
        recursive: true,
      });
    } catch (e) {
      // Folder already there?
      // TODO: Explicit check for other kinds of error
    }
  });
})()
  .then(() => {
    // Start the local web server
    const port = envGetNumber('SERVER_PORT');
    app.listen(port);
    logger.info(`Server running on port ${port}`);
  })
  .catch((e) => {
    logger.error(e.message || 'Unknown error occured');
    logger.error(`Did not start the box server.`);
  });
