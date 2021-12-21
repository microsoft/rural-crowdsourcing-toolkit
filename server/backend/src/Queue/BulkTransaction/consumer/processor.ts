import { BasicModel, setupDbConnection, WorkerModel } from "@karya/common";
import { PayoutRequest, PaymentsTransactionRecord, PayoutResponse, InsufficientBalanceError, RazorPayRequestError, AccountTaskStatus } from "@karya/core";
import { Job } from "bullmq";
import { AxiosResponse } from 'axios'
import { razorPayAxios } from "../../HttpUtils";
import { TransactionQJobData } from "../Types";

const RAZORPAY_PAYOUTS_RELATIVE_URL = 'payouts'

// Setting up Db Connection
setupDbConnection();

export default async (job: Job<TransactionQJobData>) => {

    let transactionRecord: PaymentsTransactionRecord = job.data.transactionRecord
    // Check if user has sufficient balance
    const userBalance = await WorkerModel.getBalance(transactionRecord.worker_id)
    if (userBalance >= parseInt(transactionRecord.amount)) {
        throw new InsufficientBalanceError("Insufficient Balance")
    }
    const result = await sendPayoutRequest(transactionRecord, job.data.fundId)
    // Update the status of account record
    const updatedAccountRecord = await BasicModel.updateSingle('payments_account', {id: transactionRecord.account_id}, { status: AccountTaskStatus.VERIFICATION })
}

/**
 * Send Payout Request to Razorpay
 * @param transactionRecord 
 * @param fundId 
 */
const sendPayoutRequest = async (transactionRecord: PaymentsTransactionRecord, fundId: string) => {
     // Create Request Body
     const payoutRequestBody: PayoutRequest = {
        account_number: transactionRecord.source_account,
        amount: parseInt(transactionRecord.amount!),
        currency: transactionRecord.currency,
        fund_account_id: fundId,
        mode: transactionRecord.mode,
        purpose: transactionRecord.purpose
    }
    // Set the idempotency key in the header
    const config = {
        headers: {
            "X-Payout-Idempotency": (transactionRecord.meta as any).idempotency_key
        }
    }
    // Send the request
    let response: AxiosResponse<PayoutResponse>
    let createdPayout: PayoutResponse
    try {
        console.log(payoutRequestBody)
        response = await razorPayAxios.post<PayoutResponse>(RAZORPAY_PAYOUTS_RELATIVE_URL, payoutRequestBody, config)
        console.log(response, 'response')
        createdPayout = response.data
    } catch(e: any) {
        throw new RazorPayRequestError(e.response.data.error.description)
    }

    // Update the transaction record
    try {
        const updatedMeta = pushExtraFields(transactionRecord.meta, createdPayout)

        const updatedTransactionRecord = await BasicModel.updateSingle('payments_transaction', { id: transactionRecord.id }, {
            UTR: createdPayout.utr,
            status: createdPayout.status,
            meta: updatedMeta
        })
    } catch (e: any) {
        throw new Error("Could not update the transaction record after successful payout request")
    }
}

/**
 * 
 * @param meta 
 * @param createdPayout 
 * @returns Returns the updated meta object after pushing extra fields
 */
const pushExtraFields = (meta: any, createdPayout: PayoutResponse) => {
    const updatedMeta: any = { ...meta }
    updatedMeta['entity'] = createdPayout.entity
    updatedMeta['notes'] = createdPayout.notes
    updatedMeta['fees'] = createdPayout.fees
    updatedMeta['tax'] = createdPayout.tax
    updatedMeta['reference_id'] = createdPayout.reference_id
    updatedMeta['narration'] = createdPayout.narration
    updatedMeta['batch_id'] = createdPayout.batch_id
    updatedMeta['failure_reason'] = createdPayout.failure_reason
    updatedMeta['created_at'] = createdPayout.created_at
    return updatedMeta
}