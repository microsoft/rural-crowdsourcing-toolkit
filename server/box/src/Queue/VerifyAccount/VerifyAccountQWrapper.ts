import { BasicModel, karyaLogger, Logger, QResult, QueueWrapper } from '@karya/common'
import { AccountTaskStatus, PaymentsAccountRecord } from '@karya/core';
import { Queue } from "bullmq";
import { registrationConsumer } from './consumer/registrationConsumer';
import { Qconfig, VerifyAccountQJobData, VerifyAccountQPayload, VerifyAccountQResult } from './Types'


const QLogger: Logger = karyaLogger({
    name: 'VerifyAccountQBox',
    logToConsole: true,
    consoleLogLevel: 'info',
});

export class VerifyAccountQWrapper extends QueueWrapper<Queue> {

    constructor(config: {[key: string]: any} & Qconfig) {
        super(config)
    }

    intialiseQueue(): void {
        console.log(this.config, this.config.opts)
        this.queue = new Queue<VerifyAccountQJobData>(this.config.qname, this.config.opts)
    }

    onStart(): void {
        // TODO: Write OnStart Script
    }

    async enqueue(jobName: string, payload: VerifyAccountQPayload, ...args: any[]): Promise<VerifyAccountQResult> {

        const updatedAccountRecord = await BasicModel.updateSingle('payments_account', 
        {id: payload.accountId}, {status: AccountTaskStatus.CONFIRMATION_RECEIVED})

        // TODO: Make a single object Job with payload and jobname
        let addedJob = await this.queue.add(jobName, {
            confirm: payload.confirm,
            accountId: payload.accountId,
            workerId: payload.workerId
        })

        return { jobId: addedJob.id!, updatedAccountRecord }
    }
    close() {
        return this.queue.close()
    }
}

// Defining success and failure cases for the consumer working on Queue
registrationConsumer.on("completed", (job) => {
    QLogger.info(`Completed job ${job.id} successfully`)
})

registrationConsumer.on("failed", async (job, error) => {
    QLogger.error(`Failed job ${job.id} with ${error}`)
    await BasicModel.updateSingle('payments_account', { id: job.data.accountId }, {status: AccountTaskStatus.CONFIRMATION_FAILED})
})