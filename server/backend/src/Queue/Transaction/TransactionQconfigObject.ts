import { TransactionQconfig } from './Types';
import { envGetString } from '@karya/misc-utils';

export const TransactionQconfigObject: TransactionQconfig = {
  qname: 'BACKEND_ACCOUNT_TRANSACTION_QUEUE',
  adminAccountNumber: envGetString('ADMIN_ACCOUNT_NUMBER'),
  opts: {
    connection: {
      host: 'localhost',
      port: 6379,
    },
  },
};
