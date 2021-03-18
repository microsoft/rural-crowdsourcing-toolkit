// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as moment from 'moment';
import { createLogger, format, transports } from 'winston';
// tslint:disable-next-line:no-require-imports
import DailyRotateFile = require('winston-daily-rotate-file');

import config from '../config/Index';

// get the logger configration
const { logFolder, archiveDatePattern, consoleLogLevel } = config.logConfig;

// console log format
const consoleLogFormat = format.printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}] : ${message}`;
});

// Timestamp format
const timestampFormat = format(info => {
  info.timestamp = moment()
    .utcOffset('+0530')
    .format('YYYY-MM-DD HH:mm:ss Z');
  return info;
});

// TODO: Once the DB models are in, insert archived log files into
// the DB to be transferred to the server

// setup winston configuration
const loggerConfig = {
  // include timestamp with default format
  format: format.combine(timestampFormat(), format.json()),

  // transports
  transports: [
    // console format
    new transports.Console({
      format: format.combine(
        timestampFormat(),
        consoleLogFormat,
        format.colorize(),
      ),
      level: consoleLogLevel,
    }),

    // daily rotate file for all logs
    new DailyRotateFile({
      filename: `${logFolder}/%DATE%-all.log`,
      datePattern: archiveDatePattern,
      zippedArchive: true,
    }),

    // daily rotate file for error logs
    new DailyRotateFile({
      filename: `${logFolder}/%DATE%-error.log`,
      datePattern: archiveDatePattern,
      zippedArchive: true,
      level: 'error',
    }),
  ],
};

// create a new logger
const logger = createLogger(loggerConfig);

// export the logger
export default logger;

// Request logger
const requestLoggerConfig = {
  format: format.combine(timestampFormat(), format.json()),

  // Transports
  transports: [
    new DailyRotateFile({
      dirname: logFolder,
      filename: '%DATE%-requests.log',
      datePattern: archiveDatePattern,
      zippedArchive: true,
    }),
  ],
};

export const requestLogger = createLogger(requestLoggerConfig);
