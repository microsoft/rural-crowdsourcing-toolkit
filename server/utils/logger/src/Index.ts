/**
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT license.
 *
 * Create loggers for different components of the server
 */

import moment from 'moment';
import { Logger, LoggerOptions, createLogger, format, transports } from 'winston';
import DailyRotateFile = require('winston-daily-rotate-file');

/**
 * Configuration for a new logger.
 *
 * @property name - Name for the new logger
 * @property folder - Folder under which log files are created
 * @property datePattern - Archiving pattern for logs
 * @property logToConsole - Should logs should be displayed in console
 * @property consoleLogLevel - Message level for console logs
 * @property onArchive - Callback on a log archive
 */

export type LoggerConfig = {
  name: string;
  folder?: string;
  datePattern?: string;
  logToConsole?: boolean;
  consoleLogLevel?: 'info' | 'warn' | 'error';
  onArchive?: (path: string) => Promise<void>;
};

/**
 * Timestamp format definition. Display date times in Indian Standard Time.
 */
const timestampFormat = format((info) => {
  info.timestamp = moment().utcOffset('+0530').format('YYYY-MM-DD HH:mm:ss Z');
  return info;
});

/**
 * Console log format
 */
const consoleLogFormat = format.printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

/**
 * Create a new logger with the specified config
 * @param config - Config for the required logger
 */
export function newLogger(config: LoggerConfig): Logger {
  // Extract information from the config
  const folder = config.folder ?? `${process.cwd()}/logs`;
  const datePattern = config.datePattern ?? 'YYYY-MM-DD';
  const logToConsole = config.logToConsole ?? false;
  const consoleLogLevel = config.consoleLogLevel ?? 'info';

  // Generate logger name
  const filename = `${folder}/%DATE%-${config.name}.log`;

  // The main transport
  const mainTransport = new DailyRotateFile({
    filename,
    datePattern,
    zippedArchive: true,
  });

  // Set archive call back if provided
  mainTransport.on('archive', async (path) => {
    if (config.onArchive) {
      await config.onArchive(path);
    }
  });

  // Add console transport if necessary
  const consoleTransport = new transports.Console({
    format: format.combine(timestampFormat(), consoleLogFormat),
    level: consoleLogLevel,
  });

  // Logger options
  const options: LoggerOptions = {
    format: format.combine(timestampFormat(), format.json()),
    transports: logToConsole ? [consoleTransport, mainTransport] : [mainTransport],
  };

  return createLogger(options);
}
