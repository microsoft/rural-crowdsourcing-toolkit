// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import cors from '@koa/cors';
import Koa from 'koa';

import config, { loadSecretsFromVault } from './config/Index';
import logger from './utils/Logger';

import { authenticateRequest, logHttpRequests } from './routes/Middlewares';
import router from './routes/Routes';

import { setupDbConnection } from '@karya/db';
import { createBlobContainers, createLocalFolders, setupBlobStore } from '@karya/blobstore';

// Setup Koa application
const app = new Koa();

// App middlewares
app.use(cors(config.corsConfig));
app.use(logHttpRequests);
app.use(authenticateRequest);
app.use(router.allowedMethods());
app.use(router.routes());

// Main script
(async () => {
  let error = false;

  logger.info(`Loaded '${config.name}' config`);

  // If config secrets are stored in key vault, fetch them
  if (config.azureKeyVault !== null) {
    logger.info('Loading secrets from key vault');
    await loadSecretsFromVault();
  }

  // Setup the database connection
  setupDbConnection(config.dbConfig);

  // Setup the blob store connection
  setupBlobStore(config.blob);

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
    await createLocalFolders(config.localFolder);
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
    const server = app.listen(config.serverPort);
    server.setTimeout(0);
    logger.info(`Server running on port ${config.serverPort}`);
  })
  .catch((e) => {
    logger.error(e.message);
    logger.error('Not starting the server');
  });
