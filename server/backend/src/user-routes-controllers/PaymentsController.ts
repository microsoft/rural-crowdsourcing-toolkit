import { PaymentsAccountRecord, PaymentsTransactionRecord, TransactionRequest } from '@karya/core';
import { UserRouteMiddleware } from '../routes/UserRoutes';
import * as HttpResponse from '@karya/http-response';
import { BulkTransactionQWrapper } from '../Queue/BulkTransaction/BulkTransactionQWrapper';
import { BulkTransactionQConfig } from '../Queue/BulkTransaction/BulkTransactionQConfig';
import { BasicModel, PaymentsTransactionModel, WorkerModel } from '@karya/common';

// Controller to process bulk payments request
export const processBulkPayments: UserRouteMiddleware = async (ctx) => {
  const bulkTransactionReq: TransactionRequest[] = ctx.request.body;

  // Validate the request and calculate the total amount
  let totalAmount = 0;
  for (const transactionReq of bulkTransactionReq) {
    if (!transactionReq.amount || !transactionReq.workerId) {
      HttpResponse.BadRequest(ctx, 'Invalid Body: Fields missing in one or more items of array');
      return;
    }
    const isIncorrectType = typeof transactionReq.amount != 'number' || typeof transactionReq.workerId != 'string';
    console.log(isIncorrectType);
    if (isIncorrectType) {
      HttpResponse.BadRequest(ctx, 'Invalid Body: Incorrect type in one or more items of array');
      return;
    }
    totalAmount += transactionReq.amount;
  }

  // Initialise the Bulk Transaction Queue
  const bulkTransactionQWrapper = new BulkTransactionQWrapper(BulkTransactionQConfig);
  // Enqueue
  const response = await bulkTransactionQWrapper.enqueue(
    `BULK_TRANSACTION_JOB: Amount ${totalAmount} | Number ${bulkTransactionReq.length}`,
    {
      amount: totalAmount,
      bulkTransactionRequest: bulkTransactionReq,
      n_workers: bulkTransactionReq.length,
      userId: ctx.state.entity.id,
    }
  );

  HttpResponse.OK(ctx, response.createdBulkTransactionRecord);
};

// controller to return list of eligible workers for payment with respective amount
export const calculateEligibleWorkers: UserRouteMiddleware = async (ctx) => {
  const response = await WorkerModel.getEligibleWorkersForPayments();
  HttpResponse.OK(ctx, response);
};

// Controller to get Payments Account
export const getPaymentsAccount: UserRouteMiddleware = async (ctx) => {
  let from = ctx.request.query.from;
  const qUserId = ctx.request.query.user_id;

  if (!from || from instanceof Array) {
    from = new Date(0).toISOString();
    // HttpResponse.BadRequest(ctx, 'No from time specified');
    // return;
  }

  // Get all relevant transaction records
  // TODO @enhancement: Apply pagination
  let transactionRecords: PaymentsAccountRecord[];
  if (qUserId) {
    // Get records for a particular user
    transactionRecords = await BasicModel.getRecords(
      'payments_account',
      { worker_id: qUserId as string },
      [],
      [['last_updated_at', from, null]]
    );
  } else {
    transactionRecords = await BasicModel.getRecords('payments_account', {}, [], [['last_updated_at', from, null]]);
  }

  HttpResponse.OK(ctx, transactionRecords);
};

// Controller to get transaction records for the user
export const getTransactionRecords: UserRouteMiddleware = async (ctx) => {
  let from = ctx.request.query.from;
  const qUserId = ctx.request.query.user_id;

  if (!from || from instanceof Array) {
    from = new Date(0).toISOString();
    // HttpResponse.BadRequest(ctx, 'No from time specified');
    // return;
  }

  // Get all relevant transaction records
  // TODO @enhancement: Apply pagination
  let transactionRecords: (PaymentsTransactionRecord | { unique_id: string | null })[];
  if (qUserId) {
    // Get records for a particular user
    transactionRecords = await BasicModel.getRecords(
      'payments_transaction',
      { worker_id: qUserId as string },
      [],
      [['last_updated_at', from, null]]
    );
  } else {
    transactionRecords = await PaymentsTransactionModel.getPaymentsTransactionData()
  }

  HttpResponse.OK(ctx, transactionRecords);
};

// Controller to get bulk payment transaction records for the user
export const getBulkTransactionRecords: UserRouteMiddleware = async (ctx) => {
  let from = ctx.request.query.from;

  if (!from || from instanceof Array) {
    from = new Date(0).toISOString();
    // HttpResponse.BadRequest(ctx, 'No from time specified');
  }

  // Get all relevant transaction records
  // TODO @enhancement: Apply pagination
  let transactionRecords = await BasicModel.getRecords(
    'bulk_payments_transaction',
    {},
    [],
    [['last_updated_at', from, null]]
  );

  HttpResponse.OK(ctx, transactionRecords);
};
