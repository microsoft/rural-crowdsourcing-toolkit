import { TransactionQconfigObject } from '../TransactionQconfigObject';

export default {
  processor_path: __dirname + '/processor.js',
  opts: {
    connection: {
      host: 'localhost',
      port: 6379,
    }
  },
};
