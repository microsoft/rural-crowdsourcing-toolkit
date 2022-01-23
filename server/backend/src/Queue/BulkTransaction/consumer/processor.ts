import { BasicModel, setupDbConnection } from '@karya/common';
import { Job } from 'bullmq';
import { BulkTransactionQJobData } from '../Types';
import {
  AccountTaskStatus,
  BulkPaymentsTransactionRecord,
  BulkTransactionTaskStatus,
  TransactionRequest,
} from '@karya/core';
import { TransactionQWrapper } from '../../Transaction/TransactionQWrapper';
import { TransactionQconfigObject } from '../../Transaction/TransactionQconfigObject';
import { TransactionQPayload } from '../../Transaction/Types';

const RAZORPAY_PAYOUTS_RELATIVE_URL = 'payouts';

// Setting up Db Connection
setupDbConnection();

export default async (job: Job<BulkTransactionQJobData>) => {
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
      const transactionPayload: TransactionQPayload = {
        bulk_id: bulkTransactionRecord.id,
        boxId: currentActiveAccount.box_id,
        accountId: currentActiveAccount.id,
        amount: transactionRequest.amount,
        currency: 'INR',
        fundId: currentActiveAccount.fund_id!,
        idempotencyKey: currentActiveAccount.hash + bulkTransactionRecord.id,
        mode: 'IMPS',
        purpose: 'BULK_PAYMENT',
        workerId: transactionRequest.workerId,
      };
      // Push the payload into the queue
      transactionQWrapper.enqueue(
        `BULK_TRANSACTION:${transactionRequest.workerId} | ${transactionRequest.amount}`,
        transactionPayload
      );
    } catch (e: any) {
      console.log('BULK_TRANSACTION_QUEUE: ', e.message);
      failedForWorkerIds.push(transactionRequest.workerId);
    }
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
