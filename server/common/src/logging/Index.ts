// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Entry point for logging

import { v4 as uuidv4 } from 'uuid';
import Application from 'koa';

import { newLogger, LoggerConfig } from '@karya/logger';
import { envGetString } from '@karya/misc-utils';
import { InternalError } from '@karya/http-response';
import { Logger } from '@karya/logger/node_modules/winston';
export { Logger } from '@karya/logger/node_modules/winston';

// Get the logger configuration
const logFolder = envGetString('LOG_FOLDER');
const logFolderPath = `${process.cwd()}/${logFolder}`;
const datePattern = envGetString('LOG_ARCHIVE_PATTERN');

/**
 * Create a new Karya logger
 * @param config Logger config
 */
export const karyaLogger = (config: LoggerConfig): Logger => {
  return newLogger({
    folder: logFolderPath,
    datePattern,
    ...config,
  });
};

// Http request loggers
const requestLogger = karyaLogger({ name: 'httpRequests' });
const requestErrorLogger = karyaLogger({ name: 'httpErrors' });

/**
 * Log an HTTP request.
 * @param ctx Request context
 * @param next Next middleware to call in the chain
 */
export const httpRequestLogger: Application.Middleware = async (ctx, next) => {
  // Get a unique ID for the request
  const id = uuidv4();

  // Log the request
  const request = {
    id,
    method: ctx.method,
    path: ctx.path,
    query: ctx.request.query,
    size: ctx.request.length,
  };
  requestLogger.info(request);

  // Get start time
  const start = Date.now();

  // Process the request
  await next();

  // Get end time
  const end = Date.now();

  // Log the response
  const response = {
    id,
    requester: ctx.state.entity?.id,
    status: ctx.status,
    size: ctx.response.length,
    time: end - start,
  };
  requestLogger.info(response);

  // If failed request, log more details
  if (ctx.status >= 400) {
    requestErrorLogger.error({ request, status: ctx.status, message: ctx.response.body });
  }
};

/**
 * Catch any uncaught exceptions in the middleware chain
 * @param ctx Request context
 * @param next Next middleware to call
 */
export const catchAll: Application.Middleware = async (ctx, next) => {
  try {
    await next();
  } catch (e) {
    InternalError(ctx, JSON.stringify(e));
  }
};

/**
 * Main logger to be used by the server
 */
export const mainLogger: Logger = karyaLogger({
  name: 'main',
  logToConsole: true,
  consoleLogLevel: 'info',
});
