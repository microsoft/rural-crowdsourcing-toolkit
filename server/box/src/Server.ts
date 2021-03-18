// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import cors from '@koa/cors';
import { Promise as BBPromise } from 'bluebird';
import { promises as fsp } from 'fs';
import Koa from 'koa';
import config from './config/Index';
import { SetBox, this_box } from './config/ThisBox';
import { GET } from './cron/HttpUtils';
import { authenticateRequest, httpRequestLogger } from './routes/Middlewares';
import router from './routes/Routes';
import { containerNames } from './utils/BlobContainers';
import logger from './utils/Logger';

// creates an instance of Koa app
const app = new Koa();

// app middleware
app.use(cors());
app.use(httpRequestLogger);
app.use(authenticateRequest);
app.use(router.allowedMethods());
app.use(router.routes());

// Main script to check for all dependencies and then start the box server.
(async () => {
  // Set this box
  await SetBox();

  // Create all the local file folders
  logger.info(`Creating local folders for karya files`);
  await BBPromise.mapSeries(containerNames, async cname => {
    try {
      await fsp.mkdir(`${config.filesFolder}/${cname}`, {
        recursive: true,
      });
    } catch (e) {
      // Folder already there?
      // TODO: Explicit check for other kinds of error
    }
  });

  // Get the phone authentication info
  if (!this_box.physical) {
    logger.info(`Fetching phone authentication information`);
    try {
      const phoneOtp = await GET<{}, typeof config['phoneOtp']>(
        '/rbox/phone-auth-info',
        {},
      );
      config.phoneOtp = { ...phoneOtp };
      logger.info(`Phone auth available.`);
    } catch (e) {
      // Unable to fetch api_key
      // Leave it as unavailable
    }
  }
})()
  .then(() => {
    // Start the local web server
    const port = 4040; // config.baseServerPort + box_id;
    app.listen(port);
    logger.info(`Server running on port ${port}`);
  })
  .catch(e => {
    logger.error(e.message || 'Unknown error occured');
    logger.error(`Did not start the box server.`);
  });
