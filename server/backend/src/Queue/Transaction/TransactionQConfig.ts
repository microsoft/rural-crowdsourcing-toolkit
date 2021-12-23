import { Qconfig } from "./Types"
import { envGetString } from "@karya/misc-utils";

const TransactionQConfig: Qconfig = {
    qname: "BACKEND_ACCOUNT_TRANSACTION_QUEUE",
    adminAccountNumber: envGetString('ADMIN_ACCOUNT_NUMBER'),
    opts: {
        connection: {
            host: 'localhost',
            port: 6379
        }
    } 
}

export { TransactionQConfig }