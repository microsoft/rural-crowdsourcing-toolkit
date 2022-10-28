import { BasicModel, karyaLogger, Logger, QResult, QueueWrapper } from '@karya/common';
import { AccountTaskStatus } from '@karya/core';
import { Job, Queue } from 'bullmq';
import { registrationQConsumer } from './consumer/registrationQConsumer';
import { Qconfig, RegistrationQJobData, RegistrationQPayload, RegistrationQResult } from './Types';
import { ErrorLogger, QLogger } from './Utils';

export class RegistrationQWrapper extends QueueWrapper<Queue> {
  constructor(config: { [key: string]: any } & Qconfig) {
    super(config);
  }

  // static getQueue(qname: string) {
  //     let q = new RegistrationQWrapper({qname: qname, opts: RegistrationQOpts})
  //     return q
  // }

  intialiseQueue(): void {
    console.log(this.config, this.config.opts);
    this.queue = new Queue<RegistrationQJobData>(this.config.qname, this.config.opts);
  }

  onStart(): void {
    // TODO: Write OnStart Script
  }

  async enqueue(jobName: string, payload: RegistrationQPayload, ...args: any[]): Promise<RegistrationQResult> {
    let createdAccountRecord = await BasicModel.insertRecord('payments_account', {
      box_id: payload.boxId,
      hash: payload.hash,
      worker_id: payload.workerID,
      account_type: payload.accountType,
      status: AccountTaskStatus.INITIALISED,
      active: false,
      meta: {
        name: payload.name,
        account: payload.accountDetails,
      },
    });

    // TODO: Make a single object Job with payload and jobname
    let addedJob = await this.queue.add(jobName, { accountRecord: createdAccountRecord });

    return { jobId: addedJob.id!, createdAccountRecord };
  }
  close() {
    return this.queue.close();
  }
}

/// Defining success and failure cases for the consumer working on Queue
registrationQConsumer.on('completed', (job) => {
  QLogger.info(`Completed job ${job.id} successfully with record id: ${job.data.accountRecord.id}`);
});

registrationQConsumer.on('failed', async (job: Job<RegistrationQJobData>, error) => {
  ErrorLogger.error(`Failed job ${job.id} with ${error} and record id: ${job.data.accountRecord.id}`);
});
