import { BasicModel, karyaLogger, Logger, QueueWrapper } from '@karya/common';
import { AccountTaskStatus } from '@karya/core';
import { Job, Queue } from 'bullmq';
import { ErrorLogger, QLogger } from './Utils';
import { verifyAccountQConsumer } from './consumer/verifyAccountQConsumer';
import { Qconfig, VerifyAccountQJobData, VerifyAccountQPayload, VerifyAccountQResult } from './Types';

export class VerifyAccountQWrapper extends QueueWrapper<Queue> {
  constructor(config: { [key: string]: any } & Qconfig) {
    super(config);
  }

  intialiseQueue(): void {
    console.log(this.config, this.config.opts);
    this.queue = new Queue<VerifyAccountQJobData>(this.config.qname, this.config.opts);
  }

  onStart(): void {
    // TODO: Write OnStart Script
  }

  async enqueue(jobName: string, payload: VerifyAccountQPayload, ...args: any[]): Promise<VerifyAccountQResult> {
    const updatedAccountRecord = await BasicModel.updateSingle(
      'payments_account',
      { id: payload.accountId },
      { status: AccountTaskStatus.CONFIRMATION_RECEIVED }
    );

    // TODO: Make a single object Job with payload and jobname
    let addedJob = await this.queue.add(jobName, {
      confirm: payload.confirm,
      accountRecord: updatedAccountRecord,
    });

    return { jobId: addedJob.id!, updatedAccountRecord };
  }
  close() {
    return this.queue.close();
  }
}

// Defining success and failure cases for the consumer working on Queue
verifyAccountQConsumer.on('completed', (job) => {
  QLogger.info(`Completed job ${job.id} successfully with record id: ${job.data.accountRecord.id}`);
});

verifyAccountQConsumer.on('failed', async (job: Job<VerifyAccountQJobData>, error) => {
  ErrorLogger.error(`Failed job ${job.id} with ${error} and record id: ${job.data.accountRecord.id}`);
});
