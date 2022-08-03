import { karyaLogger, Logger } from '@karya/common';

export const QLogger: Logger = karyaLogger({
  name: 'TransactionQBackend',
  logToConsole: true,
  consoleLogLevel: 'info',
});
