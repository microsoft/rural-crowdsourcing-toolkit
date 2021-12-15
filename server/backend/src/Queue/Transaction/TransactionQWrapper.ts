import { BasicModel, karyaLogger, Logger, QueueWrapper } from '@karya/common'
import { AccountTaskStatus, TransactionPurpose } from '@karya/core'
import { Queue } from "bullmq";
import { transactionConsumer } from './consumer/transactionConsumer';
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
            amount: payload.amount.toString(),
            currency: payload.currency,
            account_id: payload.accountId,
            worker_id: payload.workerId,
            source_account: this.config.adminAccountNumber,
            purpose: payload.purpose,
            mode: payload.mode,
            status: AccountTaskStatus.TRANSACTION_QUEUE,
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
transactionConsumer.on("completed", (job) => {
    QLogger.info(`Completed job ${job.id} successfully`)
})

transactionConsumer.on("failed", (job, error) => {
    QLogger.error(`Failed job ${job.id} with ${error}`)
})