import { BasicModel, karyaLogger, Logger, QueueWrapper } from '@karya/common';
import { BulkTransactionTaskStatus } from '@karya/core';
import { Job, Queue } from 'bullmq';
import { bulkTransactionQConsumer } from './consumer/bulkTransactionQConsumer';
import { Qconfig, BulkTransactionQJobData, BulkTransactionQPayload, BulkTransactionQResult } from './Types';
import { ErrorLogger, QLogger } from './Utils';

export class BulkTransactionQWrapper extends QueueWrapper<Queue> {
  constructor(config: Qconfig) {
    super(config);
  }

  intialiseQueue(): void {
    console.log(this.config, this.config.opts);
    this.queue = new Queue<BulkTransactionQJobData>(this.config.qname, this.config.opts);
  }

  onStart(): void {
    // TODO: Write OnStart Script
  }

  async enqueue(jobName: string, payload: BulkTransactionQPayload, ...args: any[]): Promise<BulkTransactionQResult> {
    let createdBulkTransactionRecord = await BasicModel.insertRecord('bulk_payments_transaction', {
      user_id: payload.userId,
      amount: payload.amount.toString(),
      n_workers: payload.n_workers.toString(),
      status: BulkTransactionTaskStatus.INITIALISED,
    });

    // TODO: Make a single object Job with payload and jobname
    let addedJob = await this.queue.add(jobName, {
      bulkTransactionRecord: createdBulkTransactionRecord,
      bulkTransactionRequest: payload.bulkTransactionRequest,
    });

    return { jobId: addedJob.id!, createdBulkTransactionRecord };
  }
  close() {
    return this.queue.close();
  }
}

// Defining success and failure cases for the consumer working on Queue
bulkTransactionQConsumer.on('completed', (job) => {
  QLogger.info(`Completed job ${job.id} successfully with record id: ${job.data.bulkTransactionRecord.id}`);
});

// Handling errors
bulkTransactionQConsumer.on('failed', async (job: Job<BulkTransactionQJobData>, error) => {
  ErrorLogger.error(
    `Failed job ${job.id} with error: ${error.message} and record id: ${job.data.bulkTransactionRecord.id}`
  );
});
