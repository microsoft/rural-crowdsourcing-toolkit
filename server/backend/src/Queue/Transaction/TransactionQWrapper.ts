import { BasicModel, karyaLogger, Logger, QueueWrapper } from '@karya/common'
import { AccountTaskStatus, InsufficientBalanceError, PaymentsTransactionRecord, RazorPayRequestError, TransactionStatus } from '@karya/core'
import { Queue } from "bullmq";
import { transactionQConsumer } from './consumer/transactionQConsumer';
import { Qconfig, TransactionQJobData, TransactionQPayload, TransactionQResult } from './Types'


const QLogger: Logger = karyaLogger({
    name: 'RegistrationQBackend',
    logToConsole: true,
    consoleLogLevel: 'info',
});

export class TransactionQWrapper extends QueueWrapper<Queue> {

    constructor(config: Qconfig) {
        super(config)
    }

    intialiseQueue(): void {
        console.log(this.config, this.config.opts)
        this.queue = new Queue<TransactionQJobData>(this.config.qname, this.config.opts)
    }

    onStart(): void {
        // TODO: Write OnStart Script
    }

    async enqueue(jobName: string, payload: TransactionQPayload, ...args: any[]): Promise<TransactionQResult> {
        let createdTransactionRecord = await BasicModel.insertRecord('payments_transaction', {
            box_id: payload.boxId,
            amount: payload.amount.toString(),
            currency: payload.currency,
            account_id: payload.accountId,
            worker_id: payload.workerId,
            source_account: this.config.adminAccountNumber,
            purpose: payload.purpose,
            mode: payload.mode,
            status: TransactionStatus.CREATED,
            meta: {
                idempotency_key: payload.idempotencyKey
            }
        })

        // TODO: Make a single object Job with payload and jobname
        let addedJob = await this.queue.add(jobName, { transactionRecord: createdTransactionRecord, fundId: payload.fundId })

        return { jobId: addedJob.id!, createdTransactionRecord }
    }
    close() {
        return this.queue.close()
    }
}

// Defining success and failure cases for the consumer working on Queue
transactionQConsumer.on("completed", (job) => {
    QLogger.info(`Completed job ${job.id} successfully`)
})

// Handling errors
transactionQConsumer.on("failed", async (job, error) => {
    QLogger.error(`Failed job ${job.id} with ${error} and data: ${job.data}`)

    let transactionRequestSucess = true
    // Determine if payout transaction was successful
    if (error instanceof RazorPayRequestError 
            || error instanceof InsufficientBalanceError) {
        transactionRequestSucess = false
    } 
    
    const transactionRecord = job.data.transactionRecord as PaymentsTransactionRecord

    // Update the transaction record with failure message
    // TODO: @Enhancement: Make a central error object pattern
    const updatedTransactionMeta = {
        ...transactionRecord.meta,
        source: "Something went wrong at Transaction Queue",
        failure_reason: `${error.message}`
    }
    const updatedStatus = transactionRequestSucess? TransactionStatus.FAILED_KARYA : TransactionStatus.FAILED
    let updatedTransactionRecord = await BasicModel.updateSingle('payments_transaction', {id: transactionRecord.id},
    {status: updatedStatus, meta: updatedTransactionMeta})

    // Update account record if purpose of transaction was verification
    if (transactionRecord.purpose = "VERIFICATION") {
        const accountRecord = await BasicModel.getSingle('payments_account', {id: transactionRecord.account_id})
        // Update the account record with failure message
        const updatedAccountnMeta = {
            ...accountRecord.meta,
            source: "Something went wrong at Transaction Queue",
            failure_reason: `${error.message}`
        }

        let updatedAccountRecord = await BasicModel.updateSingle('payments_account', {id: transactionRecord.account_id}, 
        {status: AccountTaskStatus.FAILED, meta: updatedAccountnMeta})
    }
})