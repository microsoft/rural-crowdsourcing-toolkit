import { TransactionRequest } from "@karya/core";
import { UserRouteMiddleware } from "../routes/UserRoutes";
import * as HttpResponse from '@karya/http-response';
import { BulkTransactionQWrapper } from "../Queue/BulkTransaction/BulkTransactionQWrapper";
import { BulkTransactionQConfig } from "../Queue/BulkTransaction/BulkTransactionQConfig";


export const processBulkPayments: UserRouteMiddleware = async (ctx) => {

    const bulkTransactionReq: TransactionRequest[] = ctx.request.body

    // Validate the request and calculate the total amount
    let totalAmount = 0
    for (const transactionReq of bulkTransactionReq) {
        if (!transactionReq.amount || !transactionReq.workerId) {
            HttpResponse.BadRequest(ctx, 
                "Invalid Body: Fields missing in one or more items of array")
            return      
        }
        const isIncorrectType = typeof(transactionReq.amount) != "number" || typeof(transactionReq.workerId) != "string"
       console.log(isIncorrectType)
        if (isIncorrectType) {
            HttpResponse.BadRequest(ctx, 
                "Invalid Body: Incorrect type in one or more items of array")
            return 
        }
        totalAmount += transactionReq.amount
    }

    // Initialise the Bulk Transaction Queue
    const bulkTransactionQWrapper = new BulkTransactionQWrapper(BulkTransactionQConfig)
    // Enqueue
    const response = await bulkTransactionQWrapper.enqueue(
        `BULK_TRANSACTION_JOB: Amount ${totalAmount} | Number ${bulkTransactionReq.length}`, 
        { 
            amount: totalAmount,
            bulkTransactionRequest: bulkTransactionReq,
            n_workers: bulkTransactionReq.length,
            userId: ctx.state.entity.id
        }
    )

    HttpResponse.OK(ctx, response.createdBulkTransactionRecord)
}