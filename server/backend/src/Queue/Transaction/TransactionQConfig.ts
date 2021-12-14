import { Qconfig } from "./Types"
import { envGetString } from "@karya/misc-utils";

const TransactionQConfig: Qconfig = {
    qname: "BACKEND_ACCOUNT_TRANSACTION_QUEUE",
    adminAccountNumber: envGetString('RAZORPAY_API_BASE_URL'),
    opts: {
        connection: {
            host: 'localhost',
            port: 6379
        }
    } 
}

export { TransactionQConfig }