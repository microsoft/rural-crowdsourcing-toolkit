import { VerifyAccountQConfig } from '../VerifyAccountQConfig';

export default {
  processor_path: __dirname + '/processor.js',
  opts: {
    connection: VerifyAccountQConfig.opts.connection,
  },
};
