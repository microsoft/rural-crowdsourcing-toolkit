import { BasicModel, QResult, QueueWrapper } from '@karya/common'
import { AccountTaskStatus } from '@karya/core';
import { Queue, QueueOptions } from "bullmq";
import { Qconfig, RegistrationQPayload, RegistrationQResult } from './Types'

export class RegistrationQWrapper extends QueueWrapper<Queue> {

    constructor(config: {[key: string]: any} & Qconfig) {
        super(config)
    }

    intialiseQueue(): void {
        console.log(this.config, this.config.opts)
        this.queue = new Queue<RegistrationQPayload>(this.config.qname, this.config.opts)
    }

    onStart(): void {
        // TODO: Write OnStart Script
    }

    async enqueue(jobName: string, payload: RegistrationQPayload, ...args: any[]): Promise<RegistrationQResult> {
        let createdAccountRecord = await BasicModel.insertRecord('payments_account', {
            hash: payload.hash,
            worker_id: payload.workerID,
            account_type: payload.accountType,
            status: AccountTaskStatus.INITIALISED,
            active: false,
            meta: {
                name: payload.name,
                account_details: payload.accountDetails
            }
        })

        // TODO: Make a single object Job with payload and jobname
        let addedJob = await this.queue.add(jobName, payload)

        return { jobId: addedJob.id!, createdAccountRecord }
    }
    close() {
        return this.queue.close()
    }
}