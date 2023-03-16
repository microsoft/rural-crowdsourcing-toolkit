import { BasicModel, setupDbConnection, WorkerModel } from '@karya/common';
import {
  PayoutRequest,
  PaymentsTransactionRecord,
  PayoutResponse,
  InsufficientBalanceError,
  RazorPayRequestError,
  AccountTaskStatus,
  TransactionStatus,
} from '@karya/core';
import { Job } from 'bullmq';
import { AxiosResponse } from 'axios';
import { razorPayAxios } from '../../HttpUtils';
import { TransactionQJobData } from '../Types';
import { ErrorLogger } from '../Utils';

const RAZORPAY_PAYOUTS_RELATIVE_URL = 'payouts';

// Setting up Db Connection
setupDbConnection();

export default async (job: Job<TransactionQJobData>) => {
  try {
    await processJob(job);
  } catch (error: any) {
    ErrorLogger.error(`Transaction Id ${job.data.transactionRecord.id}: Error Stack: ${error.stack}`);
    await cleanUpOnError(error, job);
    throw error;
  }
};

const processJob = async (job: Job<TransactionQJobData>) => {
  let transactionRecord: PaymentsTransactionRecord = job.data.transactionRecord;
  // Check if user has sufficient balance
  // Add the transaction amount since the transaction record has status CREATED and would be subtracted in getBalace function
  const dbBalance = await WorkerModel.getBalance(transactionRecord.worker_id);
  const userBalance = dbBalance + transactionRecord.amount;

  // If db balance is negative, it means transaction amount is more than user's balance
  if (dbBalance < 0) {
    // Let verification transactions go through
    // Let small amounts go through
    // If difference is less than 5, go through (floating point error)
    if (!(transactionRecord.purpose == 'VERIFICATION' || transactionRecord.amount < 5 || dbBalance > -5)) {
      throw new InsufficientBalanceError(
        `Insufficient Balance: User Balance - ${userBalance}, Transaction Amount: ${transactionRecord.amount}`
      );
    }
  }

  const result = await sendPayoutRequest(transactionRecord, job.data.fundId);
  // Update the status of account record
  // TODO: @Quick: Change the status to transaction created when we have the webhooks working
  if (transactionRecord.purpose == 'VERIFICATION') {
    const updatedAccountRecord = await BasicModel.updateSingle(
      'payments_account',
      { id: transactionRecord.account_id },
      { status: AccountTaskStatus.TRANSACTION_CREATED }
    );
  }
};

/**
 * Send Payout Request to Razorpay
 * @param transactionRecord
 * @param fundId
 */
const sendPayoutRequest = async (transactionRecord: PaymentsTransactionRecord, fundId: string) => {
  // Create Request Body
  const payoutRequestBody: PayoutRequest = {
    account_number: transactionRecord.source_account,
    // Converting rupees to paisa
    amount: Math.floor(transactionRecord.amount! * 100),
    currency: transactionRecord.currency,
    fund_account_id: fundId,
    mode: transactionRecord.mode,
    purpose: transactionRecord.purpose,
  };
  // Set the idempotency key in the header
  const config = {
    headers: {
      'X-Payout-Idempotency': (transactionRecord.meta as any).idempotency_key,
    },
  };
  // Send the request
  let response: AxiosResponse<PayoutResponse>;
  let createdPayout: PayoutResponse;
  try {
    response = await razorPayAxios.post<PayoutResponse>(RAZORPAY_PAYOUTS_RELATIVE_URL, payoutRequestBody, config);
    createdPayout = response.data;
  } catch (e: any) {
    // Log the error
    // Check if error description exists if not, add the string for original error
    if (e.response.data.error.description) {
      throw new RazorPayRequestError(e.response.data.error.description);
    } else {
      ErrorLogger.error(`Transaction Id ${transactionRecord.id}: Error Stack: ${e.stack}`);
      throw new RazorPayRequestError(e);
    }
    
  }

  // Update the transaction record
  try {
    const updatedMeta = pushExtraFields(transactionRecord.meta, createdPayout);

    const updatedTransactionRecord = await BasicModel.updateSingle(
      'payments_transaction',
      { id: transactionRecord.id },
      {
        payout_id: createdPayout.id,
        UTR: createdPayout.utr,
        status: createdPayout.status,
        meta: updatedMeta,
      }
    );
  } catch (e: any) {
    throw new Error(e);
  }
};

/**
 * Push extra fields from Payout Response in the meta object
 * @param meta
 * @param createdPayout
 * @returns Returns the updated meta object after pushing extra fields
 */
const pushExtraFields = (meta: any, createdPayout: PayoutResponse) => {
  const updatedMeta: any = { ...meta };
  updatedMeta['entity'] = createdPayout.entity;
  updatedMeta['notes'] = createdPayout.notes;
  updatedMeta['fees'] = createdPayout.fees;
  updatedMeta['tax'] = createdPayout.tax;
  updatedMeta['reference_id'] = createdPayout.reference_id;
  updatedMeta['narration'] = createdPayout.narration;
  updatedMeta['batch_id'] = createdPayout.batch_id;
  updatedMeta['failure_reason'] = createdPayout.failure_reason;
  updatedMeta['created_at'] = createdPayout.created_at;
  return updatedMeta;
};

/**
 *
 */
const cleanUpOnError = async (error: any, job: Job<TransactionQJobData>) => {
  let transactionRequestSucess = true;
  // Determine if payout transaction was successful
  if (error instanceof RazorPayRequestError || error instanceof InsufficientBalanceError) {
    transactionRequestSucess = false;
  }

  const transactionRecord = job.data.transactionRecord;

  // Update the transaction record with failure message
  // TODO: @Enhancement: Make a central error object pattern
  const updatedTransactionMeta = {
    ...transactionRecord.meta,
    failure_server: 'server',
    failure_source: 'Transaction Queue Processor',
    failure_reason: error.message + " test log",
  };
  const updatedStatus = transactionRequestSucess
    ? TransactionStatus.FAILED_AFTER_TRANSACTION
    : TransactionStatus.FAILED_BEFORE_TRANSACTION;
  let updatedTransactionRecord = await BasicModel.updateSingle(
    'payments_transaction',
    { id: transactionRecord.id },
    { status: updatedStatus, meta: updatedTransactionMeta }
  );

  // Update account record if purpose of transaction was verification
  if (transactionRecord.purpose == 'VERIFICATION') {
    const accountRecord = await BasicModel.getSingle('payments_account', {
      id: transactionRecord.account_id,
    });
    // Update the account record with failure message
    const updatedAccountMeta = {
      ...accountRecord.meta,
      failure_server: 'server',
      failure_source: 'Transaction Queue Processor',
      failure_reason: error.message,
    };

    await BasicModel.updateSingle(
      'payments_account',
      { id: transactionRecord.account_id },
      { status: AccountTaskStatus.FAILED, meta: updatedAccountMeta }
    );
  }
};
