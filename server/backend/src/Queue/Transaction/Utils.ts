import { karyaLogger, Logger } from '@karya/common';

export const QLogger: Logger = karyaLogger({
  name: 'TransactionQBackend',
  logToConsole: true,
  consoleLogLevel: 'info',
});

export const ErrorLogger: Logger = karyaLogger({
  name: 'TransactionQBackendError',
  logToConsole: true,
  consoleLogLevel: 'error',
});
