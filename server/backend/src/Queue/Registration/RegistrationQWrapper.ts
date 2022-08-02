import { BasicModel, karyaLogger, Logger, QResult, QueueWrapper } from '@karya/common';
import { AccountTaskStatus } from '@karya/core';
import { Job, Queue } from 'bullmq';
import { registrationQConsumer } from './consumer/registrationQConsumer';
import { Qconfig, RegistrationQJobData, RegistrationQPayload, RegistrationQResult } from './Types';

const QLogger: Logger = karyaLogger({
  name: 'RegistrationQBackend',
  logToConsole: true,
  consoleLogLevel: 'info',
});

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
    let createdAccountRecord = await BasicModel.upsertRecord('payments_account', {
      ...payload.accountRecord,
      box_id: payload.boxId,
      status: AccountTaskStatus.SERVER_API,
    });

    // TODO: Make a single object Job with payload and jobname
    let addedJob = await this.queue.add(jobName, { accountRecord: createdAccountRecord });

    return { jobId: addedJob.id!, createdAccountRecord };
  }
  close() {
    return this.queue.close();
  }
}

// Defining success and failure cases for the consumer working on Queue
registrationQConsumer.on('completed', (job) => {
  QLogger.info(`Completed job ${job.id} successfully`);
});

registrationQConsumer.on('failed', async (job: Job<RegistrationQJobData>, error) => {
  QLogger.error(`Failed job ${job.id} with ${error} and record id ${job.data.accountRecord.id}`);

  const accountRecord = job.data.accountRecord;
  const meta = accountRecord.meta;
  // Update the status and save the error in the database
  const updatedAccountRecord = await BasicModel.updateSingle(
    'payments_account',
    { id: accountRecord.id },
    {
      status: AccountTaskStatus.FAILED,
      meta: {
        ...meta,
        failure_server: 'server',
        failure_source: 'Account Registration Queue Processor',
        failure_reason: error.message,
      },
    }
  );
});
