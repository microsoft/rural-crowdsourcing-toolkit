import { karyaLogger, Logger } from '@karya/common';

export const QLogger: Logger = karyaLogger({
  name: 'BulkTransactionQBackend',
  logToConsole: true,
  consoleLogLevel: 'info',
});

export const ErrorLogger: Logger = karyaLogger({
  name: 'BulkTransactionQBackendError',
  logToConsole: true,
  consoleLogLevel: 'error',
});
