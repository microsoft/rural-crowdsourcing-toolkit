import { Qconfig } from "./Types"

const VerifyAccountQConfig: Qconfig = {
    qname: "BOX_VERIFY_ACCOUNT_QUEUE",
    opts: {
        connection: {
            host: 'localhost',
            port: 6379
        }
    } 
}

export { VerifyAccountQConfig }