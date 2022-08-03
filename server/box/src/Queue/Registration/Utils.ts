import { karyaLogger, Logger } from '@karya/common';

export const QLogger: Logger = karyaLogger({
  name: 'RegistrationQBox',
  logToConsole: true,
  consoleLogLevel: 'info',
});
