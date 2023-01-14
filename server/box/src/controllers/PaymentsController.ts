import { KaryaMiddleware } from '../KoaContextState';
import { AccountTaskStatus, PaymentsAccountRecord, WorkerRecord } from '@karya/core';
import { BasicModel, mainLogger, WorkerModel } from '@karya/common';
import * as HttpResponse from '@karya/http-response';
import { calculateHash, envGetString } from '@karya/misc-utils';
import * as underscore from 'underscore';
import { RegistrationQWrapper } from '../Queue/Registration/RegistrationQWrapper';
import { RegistrationQPayload } from '../Queue/Registration/Types';
import { RegistrationQConfig } from '../Queue/Registration/RegistrationQConfig';
import { VerifyAccountQWrapper } from '../Queue/VerifyAccount/VerifyAccountQWrapper';
import { VerifyAccountQConfig } from '../Queue/VerifyAccount/VerifyAccountQConfig';
import axios from 'axios';

type accountRegReqObject = {
  type: 'bank_account' | 'vpa';
  name: string;
  account: {
    id: string;
    ifsc?: string;
  };
};

const accountRegResObjectFields = [
  'id',
  'hash',
  'worker_id',
  'fund_id',
  'account_type',
  'status',
  'active',
  'meta',
  'extras',
  'created_at',
  'last_updated_at',
];

export const addAccount: KaryaMiddleware = async (ctx, next) => {
  // Validate request body
  let accountBody: accountRegReqObject = ctx.request.body;
  let isAccountBodyValid = true;

  if (
    !(
      accountBody.name &&
      typeof accountBody.name == 'string' &&
      accountBody.account.id &&
      typeof accountBody.account.id == 'string'
    )
  ) {
    isAccountBodyValid = false;
  } else {
    // Clean up
    accountBody.name = accountBody.name.trim()
    // Remove extra spaces in name
    accountBody.name = accountBody.name.replace("/\s+/g", " ")
    accountBody.account.id = accountBody.account.id?.trim()
  }

  if (accountBody.type == 'bank_account') {
    if (!(accountBody.account.ifsc && typeof accountBody.account.ifsc == 'string')) {
      isAccountBodyValid = false;
    }
    // Clean up
    accountBody.account.ifsc = accountBody.account.ifsc?.trim() 
  } else if (accountBody.type != 'vpa') {
    isAccountBodyValid = false;
  }

  // if validation failed send bad request
  if (isAccountBodyValid == false) {
    HttpResponse.BadRequest(ctx, 'Request body is not valid');
    return;
  }

  // Check if account verification is in progress for the user
  let inProgressRecord: PaymentsAccountRecord;
  let inProgressStatus = [
    'INITIALISED',
    'BOX_ACCOUNTS_QUEUE',
    'SERVER_API',
    'SERVER_ACCOUNTS_QUEUE',
    'TRANSACTION_CREATED',
    'VERIFICATION',
    'CONFIRMATION_RECEIVED',
    'CONFIRMATION_FAILED',
  ];

  for (var st of inProgressStatus) {
    try {
      inProgressRecord = await BasicModel.getSingle('payments_account', { worker_id: ctx.state.entity.id, status: st });
      HttpResponse.BadRequest(ctx, `Verification for ${inProgressRecord.id} already in progress with status: ${st}`);
      return;
    } catch (e) {
      mainLogger.info(`Cant find account record with status ${st} for user_id: ${ctx.state.entity.id}`);
    }
  }

  // No account verification in progress. 
  // Calculate hash from worker id, account id and ifsc code for bank account
  // and from worker id and account id in case of UPI
  let hash = accountBody.type == 'bank_account' 
    ? calculateHash(ctx.state.entity.id, accountBody.account.id, accountBody.account.ifsc!, accountBody.name)
    : calculateHash(ctx.state.entity.id, accountBody.account.id)

  // Determine if there is already a record with the given hash
  let accountRecord: PaymentsAccountRecord | null = null
  try {
    accountRecord = await BasicModel.getSingle('payments_account', { hash });
  } catch (e) {
    mainLogger.info(`Cant find account record with hash ${hash} for user_id: ${ctx.state.entity.id}`);
  }

  if (accountRecord != null) {
    try {
      // The record exists, check if the status is rejected
      if (accountRecord.status != AccountTaskStatus.REJECTED && accountRecord.status != AccountTaskStatus.VERIFIED) {
        const errorMsg = `The account with id: ${accountRecord.id} already exists and is not rejected or verified`
        mainLogger.error(errorMsg);
        return HttpResponse.BadRequest(ctx, errorMsg)
      }
      const backendAxios = axios.create({
        baseURL: envGetString('BACKEND_SERVER_URL'),
      });
      // set request header
      const box = (await BasicModel.getRecords('box', {}))[0];
      const headers = { 'karya-id-token': box.id_token! };
      // Make the request
      const response = await backendAxios.put<PaymentsAccountRecord>(
        `api_box/payments/accounts/changeSelectedAccount`,
        {
          workerId: accountRecord.worker_id,
          selectedAccount: accountRecord.id
        },
        { headers: headers }
      );
      //Update the status in box
      const updatedAccountRecord = await BasicModel.updateSingle('payments_account', {id: response.data.id}, {status: response.data.status})
      // Change selected account
      const updatedWorker = await BasicModel.updateSingle('worker', {id: accountRecord.worker_id}, {selected_account: accountRecord.id})
      // Send the record
      const result = underscore.pick(updatedAccountRecord, accountRegResObjectFields);
      HttpResponse.OK(ctx, result);
      return;
    } catch (e) {
      mainLogger.info(`Cannot change account for worker: ${accountRecord.worker_id} for account: ${accountRecord.id}`);
    }
  }
  
  // Create and enque account registration task
  let jobPayload: RegistrationQPayload = {
    boxId: ctx.state.entity.box_id,
    workerID: ctx.state.entity.id,
    name: accountBody.name,
    accountType: accountBody.type,
    accountDetails: accountBody.account,
    hash,
  };

  const accountRegistrationQueue = new RegistrationQWrapper(RegistrationQConfig);
  const enQResult = await accountRegistrationQueue.enqueue(hash, jobPayload);
  const createdAccountRecord = enQResult.createdAccountRecord;

  const result = underscore.pick(createdAccountRecord, accountRegResObjectFields);
  HttpResponse.OK(ctx, result);
  return;
};

export const verifyAccount: KaryaMiddleware = async (ctx, next) => {
  // Validate Request
  const verifyBody = ctx.request.body;
  if (verifyBody.confirm === undefined) {
    HttpResponse.BadRequest(ctx, 'Missing field in body: confirm');
    return;
  }

  // Verify if account exits
  const accountId = ctx.params.id;
  let accountRecord: PaymentsAccountRecord;
  try {
    accountRecord = await BasicModel.getSingle('payments_account', { id: accountId });
  } catch (err) {
    HttpResponse.BadRequest(ctx, 'Account Id is not valid');
    return;
  }
  // Verify if account is associated with the worker
  if (accountRecord!.worker_id != ctx.state.entity.id) {
    HttpResponse.BadRequest(ctx, 'Account Id is not associated with the worker');
  }
  // Verify if the account needs to be verified
  if (
    accountRecord!.status != AccountTaskStatus.VERIFICATION &&
    accountRecord!.status != AccountTaskStatus.CONFIRMATION_FAILED
  ) {
    HttpResponse.BadRequest(ctx, `Provided account id has the status ${accountRecord!.status}`);
    return;
  }
  // Initialise Queue
  const verifyAccountQueue = new VerifyAccountQWrapper(VerifyAccountQConfig);
  const result = await verifyAccountQueue.enqueue(accountId, {
    accountId: accountId,
    confirm: verifyBody.confirm,
    workerId: ctx.state.entity.id,
  });

  HttpResponse.OK(ctx, result.updatedAccountRecord);
};

export const getCurrentActiveAccount: KaryaMiddleware = async (ctx, next) => {
  const workerId = ctx.state.entity.id;
  // Get selected account for worker
  const select_account_id = ctx.state.entity.selected_account;
  // If id is not empty return the account record
  if (select_account_id != null) {
    const accountRecord = await BasicModel.getSingle('payments_account', {id: select_account_id})
    return HttpResponse.OK(ctx, accountRecord)
  }

  // Return empty account record, if no record found
  const accountRecord: PaymentsAccountRecord = {
    id: '',
    account_type: '',
    active: false,
    box_id: '',
    created_at: '',
    extras: null,
    fund_id: '',
    hash: '',
    last_updated_at: '',
    local_id: '',
    meta: {
      account: { ifsc: '' },
      name: '',
    },
    worker_id: '',
    status: AccountTaskStatus.UNINITIALISED,
  }; // Get the last element to get latest added account
  return HttpResponse.OK(ctx, accountRecord);
};

// Controller to send Transaction records to client
export const getTransactionRecords: KaryaMiddleware = async (ctx, next) => {
  // Check if from is valid
  // TODO: Check if from is formatted correctly
  const from = ctx.request.query.from;
  if (!from || from instanceof Array) {
    HttpResponse.BadRequest(ctx, 'Missing or invalid from time');
    return;
  }

  const records = await BasicModel.getRecords(
    'payments_transaction',
    { worker_id: ctx.state.entity.id },
    [],
    [['created_at', from, null]],
    'created_at'
  );
  // Reverse the array
  records.reverse();
  HttpResponse.OK(ctx, records);
};

/**
 * Get Balance for a worker
 */
export const getWorkerBalance: KaryaMiddleware = async (ctx, next) => {
  // TODO @enhancement: Validate the input
  const workerId = ctx.params.id;
  let workerBalance = await WorkerModel.getBalance(workerId);
  workerBalance = workerBalance < 0 ? 0 : workerBalance
  const totalSpent = await WorkerModel.getTotalSpent(workerId);
  return HttpResponse.OK(ctx, { worker_balance: workerBalance, total_spent: totalSpent });
};

/**
 * Get all the worker status
 */
export const getWorkerEarningStatus: KaryaMiddleware = async (ctx, next) => {
  const worker_id = ctx.state.entity.id;
  const total_earned = await WorkerModel.getTotalEarned(worker_id);
  const week_earned = await WorkerModel.getWeekEarned(worker_id);
  let total_paid = await WorkerModel.getTotalSpent(worker_id);
  if (total_paid > total_earned) total_paid = total_earned
  return HttpResponse.OK(ctx, { total_earned, week_earned, total_paid });
};
