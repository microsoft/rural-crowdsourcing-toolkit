import { karyaLogger, Logger } from '@karya/common';

export const QLogger: Logger = karyaLogger({
  name: 'VerifyAccountQBox',
  logToConsole: true,
  consoleLogLevel: 'info',
});

export const ErrorLogger: Logger = karyaLogger({
  name: 'VerifyAccountQBoxError',
  logToConsole: true,
  consoleLogLevel: 'error',
});
