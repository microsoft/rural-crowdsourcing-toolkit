import { TransactionQConfig } from "../TransactionQConfig";

export default {
    processor_path: __dirname + '/processor.js',
    opts: {
        connection: TransactionQConfig.opts.connection,
        concurrency: 1000,
    }
}