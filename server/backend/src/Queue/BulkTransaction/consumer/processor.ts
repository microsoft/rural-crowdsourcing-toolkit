import { BasicModel, setupDbConnection } from '@karya/common';
import { Job } from 'bullmq';
import { BulkTransactionQJobData } from '../Types';
import {
  AccountTaskStatus,
  BulkPaymentsTransactionRecord,
  BulkTransactionTaskStatus,
  TransactionRequest,
} from '@karya/core';
import { TransactionQconfigObject } from '../../Transaction/TransactionQconfigObject';
import { TransactionQPayload } from '../../Transaction/Types';
import { ErrorLogger } from '../Utils';
import { TransactionQWrapper } from '../../Transaction/TransactionQWrapper';

// Setting up Db Connection
setupDbConnection();

export default async (job: Job<BulkTransactionQJobData>) => {
  try {
    await processJob(job);
  } catch (error: any) {
    ErrorLogger.error(
      `Bulk Transaction Id ${job.data.bulkTransactionRecord.id}: Stack : ${error.stack}`
    );
    await cleanUpOnError(error, job);
    throw error;
  }
};

const processJob = async (job: Job<BulkTransactionQJobData>) => {
  const bulkTransactionRecord: BulkPaymentsTransactionRecord = job.data.bulkTransactionRecord;
  // Update the status of bulk transaction record
  const updatedBulkTransactionRecord = await BasicModel.updateSingle(
    'bulk_payments_transaction',
    { id: bulkTransactionRecord.id },
    { status: BulkTransactionTaskStatus.SERVER_BULK_TRANSACTION_QUEUE }
  );

  const bulkTransactionRequest: TransactionRequest[] = job.data.bulkTransactionRequest;
  // Create Transaction Queue
  const transactionQWrapper = new TransactionQWrapper(TransactionQconfigObject);
  // Create transaction for every record
  const failedForWorkerIds: string[] = [];

  for (const transactionRequest of bulkTransactionRequest) {
    try {
      // Get Worker Record
      const workerRecord = await BasicModel.getSingle('worker', { id: transactionRequest.workerId });
      // Get current account
      const currentActiveAccount = await BasicModel.getSingle('payments_account', {
        id: workerRecord.selected_account!,
      });
      // Check if the active account is verified
      if (currentActiveAccount.status != AccountTaskStatus.VERIFIED) {
        throw new Error('The worker do not have an active verified account');
      }
      // Create the transaction task payload
      // TODO @enhancement: Change the idempotency key to a random number
      // TODO: @enhancement: Change the hard coded strings to enums
      const transactionMode = currentActiveAccount.account_type === 'bank_account' ? 'IMPS' : 'UPI';
      const transactionPayload: TransactionQPayload = {
        bulk_id: bulkTransactionRecord.id,
        boxId: currentActiveAccount.box_id,
        accountId: currentActiveAccount.id,
        amount: transactionRequest.amount,
        currency: 'INR',
        fundId: currentActiveAccount.fund_id!,
        idempotencyKey: currentActiveAccount.hash + bulkTransactionRecord.id,
        mode: transactionMode,
        purpose: 'BULK_PAYMENT',
        workerId: transactionRequest.workerId,
      };
      // Push the payload into the queue
      transactionQWrapper.enqueue(
        `BULK_TRANSACTION:${transactionRequest.workerId} | ${transactionRequest.amount}`,
        transactionPayload
      );
    } catch (e: any) {
      ErrorLogger.error(
        `Bulk Transaction Id ${bulkTransactionRecord.id}: Error creating transaction task for workerId: ${transactionRequest.workerId} with error ${e.message}`
      );
      failedForWorkerIds.push(transactionRequest.workerId);
    }
  }

  // Check if all transactions failed
  if (failedForWorkerIds.length == bulkTransactionRequest.length) {
    throw new Error('Every transaction in bulk request failed');
  }

  // Check if only some transactions were able to succeed
  if (failedForWorkerIds.length > 0) {
    const updatedBulkTransactionRecord = BasicModel.updateSingle(
      'bulk_payments_transaction',
      { id: bulkTransactionRecord.id },
      {
        status: BulkTransactionTaskStatus.PARTIAL_PROCESSED,
        meta: {
          failedForWorkerIds,
        },
      }
    );
  } else {
    const updatedBulkTransactionRecord = BasicModel.updateSingle(
      'bulk_payments_transaction',
      { id: bulkTransactionRecord.id },
      {
        status: BulkTransactionTaskStatus.TRANSACTIONS_PROCESSED,
      }
    );
  }
};

const cleanUpOnError = async (error: any, job: Job<BulkTransactionQJobData>) => {
  const bulkTransactionRecord = job.data.bulkTransactionRecord;
  const meta = bulkTransactionRecord.meta;
  // Update the status and save the error in the database
  const updatedBulkTransactionRecord = await BasicModel.updateSingle(
    'bulk_payments_transaction',
    { id: bulkTransactionRecord.id },
    {
      status: BulkTransactionTaskStatus.FAILED,
      meta: {
        ...meta,
        failure_server: 'server',
        failure_source: 'Bulk Transaction Queue Processor',
        failure_reason: error.message,
      },
    }
  );
};
