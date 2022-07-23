import { Qconfig } from './Types';

const BulkTransactionQConfig: Qconfig = {
  qname: 'BACKEND_BULK_TRANSACTION_QUEUE',
  opts: {
    connection: {
      host: 'localhost',
      port: 6379,
    },
  },
};

export { BulkTransactionQConfig };
