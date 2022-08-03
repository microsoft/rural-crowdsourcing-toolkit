import { BasicModel, karyaLogger, Logger, BullMqWrapper } from '@karya/common';
import { TransactionStatus } from '@karya/core';
import { TransactionQJobData, TransactionQPayload, TransactionQResult } from './Types';
import { transactionQConsumer } from './consumer/transactionQConsumer';
import { Job } from 'bullmq';
import { QLogger } from './Utils';

export class TransactionQWrapper extends BullMqWrapper<TransactionQJobData> {
  onStart(): void {
    // TODO: Write OnStart Script
  }

  async enqueue(jobName: string, payload: TransactionQPayload, ...args: any[]): Promise<TransactionQResult> {
    let createdTransactionRecord = await BasicModel.insertRecord('payments_transaction', {
      bulk_id: payload.bulk_id ? payload.bulk_id : null,
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
        idempotency_key: payload.idempotencyKey,
      },
    });

    // TODO: Make a single object Job with payload and jobname
    let addedJob = await this.queue.add(jobName, {
      transactionRecord: createdTransactionRecord,
      fundId: payload.fundId,
    });

    return { jobId: addedJob.id!, createdTransactionRecord };
  }
}

// Logging events on consumer
transactionQConsumer.on('completed', (job) => {
  QLogger.info(`Completed job ${job.id} successfully with record id: ${job.data.transactionRecord.id}`);
});

// Handling Failure events
transactionQConsumer.on('failed', async (job: Job<TransactionQJobData>, error) => {
  QLogger.error(`Failed job ${job.id} with ${error} and record id: ${job.data.transactionRecord.id}`);
});
