import { Qconfig } from './Types';

const RegistrationQConfig: Qconfig = {
  qname: 'BACKEND_ACCOUNT_REGISTRATION_QUEUE',
  opts: {
    connection: {
      host: 'localhost',
      port: 6379,
    },
  },
};

export { RegistrationQConfig };
