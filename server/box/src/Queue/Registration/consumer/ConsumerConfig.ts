import { RegistrationQConfig } from "../RegistrationQConfig";

export default {
    processor_path: __dirname + '/processor.js',
    opts: {
        connection: RegistrationQConfig.opts.connection,
        concurrency: 1000,
    }
}