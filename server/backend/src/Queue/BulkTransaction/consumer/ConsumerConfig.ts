import { BulkTransactionQConfig } from '../BulkTransactionQConfig';

export default {
  processor_path: __dirname + '/processor.js',
  opts: {
    connection: BulkTransactionQConfig.opts.connection,
    concurrency: 1000,
  },
};
