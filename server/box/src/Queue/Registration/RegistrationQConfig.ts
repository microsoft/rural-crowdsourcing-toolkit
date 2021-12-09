import { Qconfig } from "./Types"

const RegistrationQConfig: Qconfig = {
    qname: "ACCOUNT_REGISTRATION_QUEUE",
    opts: {
        connection: {
            host: 'localhost',
            port: 6379
        }
    } 
}

export { RegistrationQConfig }