import { karyaLogger, Logger } from '@karya/common';

export const QLogger: Logger = karyaLogger({
  name: 'RegistrationQBackend',
  logToConsole: true,
  consoleLogLevel: 'info',
});
