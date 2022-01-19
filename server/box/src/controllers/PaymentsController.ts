import { KaryaMiddleware } from '../KoaContextState';
import { AccountTaskStatus, PaymentsAccountRecord } from '@karya/core';
import { BasicModel, mainLogger, WorkerModel } from '@karya/common';
import * as HttpResponse from '@karya/http-response';
import { calculateHash } from '@karya/misc-utils';
import * as underscore from 'underscore';
import { RegistrationQWrapper } from '../Queue/Registration/RegistrationQWrapper';
import { RegistrationQPayload } from '../Queue/Registration/Types';
import { RegistrationQConfig } from '../Queue/Registration/RegistrationQConfig';
import { VerifyAccountQWrapper } from '../Queue/VerifyAccount/VerifyAccountQWrapper';
import { VerifyAccountQConfig } from '../Queue/VerifyAccount/VerifyAccountQConfig';

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
  }

  if (accountBody.type == 'bank_account') {
    if (!(accountBody.account.ifsc && typeof accountBody.account.ifsc == 'string')) {
      isAccountBodyValid = false;
    }
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
      inProgressRecord = await BasicModel.getSingle('payments_account', { status: st });
      // TODO: Uncomment this line
      HttpResponse.BadRequest(ctx, `Verification for ${inProgressRecord.id} already in progress with status: ${st}`);
      return;
    } catch (e) {
      mainLogger.info(`Cant find account record with status ${st} for user_id: ${ctx.state.entity.id}`);
    }
  }

  // No account verification in progress. Calculate hash from worker id, account id and ifsc code
  let hash = calculateHash(ctx.state.entity.id, accountBody.account.id, accountBody.account.ifsc || '');

  // Determine if there is already a record with the given hash
  try {
    let record = await BasicModel.getSingle('payments_account', { hash });
    // Send the existing record
    const result = underscore.pick(record, accountRegResObjectFields);
    HttpResponse.OK(ctx, result);
    return;
  } catch (e) {
    mainLogger.info(`Cant find account record with hash ${hash} for user_id: ${ctx.state.entity.id}`);
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

  // Return lastest account with the worker_id
  const accountRecord: PaymentsAccountRecord = (
    await BasicModel.getRecords('payments_account', { worker_id: workerId }, [], [], 'created_at')
  ).pop() || {
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
  const workerBalance = await WorkerModel.getBalance(workerId);
  const totalSpent = await WorkerModel.getTotalSpent(workerId);
  return HttpResponse.OK(ctx, { worker_balance: workerBalance, total_spent: totalSpent });
};
