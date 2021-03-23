// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { newLogger } from '@karya/logger';
import config from '../config/Index';
// TODO: Seemingly unncessary type import (TS2742)
import { Logger } from '@karya/logger/node_modules/winston';

// get the logger configration
const { logFolder, archiveDatePattern, consoleLogLevel } = config.logConfig;

// Main logger
// TODO: Unnecessary type annotation (TS2742)
const logger: Logger = newLogger({
  name: 'main',
  folder: logFolder,
  datePattern: archiveDatePattern,
  logToConsole: true,
  consoleLogLevel,
});

export default logger;

// Request logger
export const requestLogger = newLogger({
  name: 'requests',
  folder: logFolder,
  datePattern: archiveDatePattern,
});
