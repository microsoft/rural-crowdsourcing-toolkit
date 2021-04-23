// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import dotenv from 'dotenv';
dotenv.config();

import { loadSecrets } from './secrets/Index';
import cors from '@koa/cors';
import Koa from 'koa';
import logger from './utils/Logger';
import { authenticateRequest, logHttpRequests } from './routes/Middlewares';
import router from './routes/Routes';
import { setupDbConnection } from '@karya/db';
import { createBlobContainers, createLocalFolders, setupBlobStore } from '@karya/blobstore';
import { envGetNumber, envGetString } from '@karya/misc-utils';

// Setup Koa application
const app = new Koa();

// App middlewares
app.use(cors({ origin: envGetString('CORS_ORIGIN', ''), credentials: true }));
app.use(logHttpRequests);
app.use(authenticateRequest);
app.use(router.allowedMethods());
app.use(router.routes());

// Main script
(async () => {
  let error = false;

  // If config secrets are stored in key vault, fetch them
  await loadSecrets(['GOOGLE_CLIENT_ID', 'AZURE_BLOB_KEY', 'PHONE_OTP_API_KEY']);

  // Setup the database connection
  setupDbConnection();

  // Setup the blob store connection
  setupBlobStore();

  // Create blob containers
  logger.info(`Creating blob containers if not present`);
  try {
    await createBlobContainers();
    logger.info(`Completed check for containers`);
  } catch (e) {
    logger.error('Blob containers check failed.');
    error = true;
  }

  // Create local folders
  logger.info(`Creating local folders for the containers`);
  try {
    const localFolder = envGetString('LOCAL_FOLDER');
    await createLocalFolders(`${process.cwd()}/${localFolder}`);
    logger.info(`Created all local folders`);
  } catch (e) {
    logger.error('Failed to create local folders');
    error = true;
  }

  if (error) {
    throw new Error('Failed to configure some of the necessary services');
  }
})()
  .then((res) => {
    // Start the local web server
    const port = envGetNumber('SERVER_PORT');
    const server = app.listen(port);
    server.setTimeout(0);
    logger.info(`Server running on port ${port}`);
  })
  .catch((e) => {
    logger.error(e.message);
    logger.error('Not starting the server');
  });
