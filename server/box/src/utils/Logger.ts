// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { newLogger } from '@karya/logger';
// TODO: Seemingly unncessary type import (TS2742)
import { Logger } from '@karya/logger/node_modules/winston';
import { envGetString } from '@karya/misc-utils';

// get the logger configration
// get the logger configration
const logFolder = envGetString('LOG_FOLDER');
const logFolderPath = `${process.cwd()}/${logFolder}`;
const datePattern = envGetString('LOG_ARCHIVE_PATTERN');

// Main logger
// TODO: Unnecessary type annotation (TS2742)
const logger: Logger = newLogger({
  name: 'main',
  folder: logFolderPath,
  datePattern,
  logToConsole: true,
  consoleLogLevel: 'info',
});

export default logger;

// Request logger
export const requestLogger = newLogger({
  name: 'requests',
  folder: logFolderPath,
  datePattern: datePattern,
});
