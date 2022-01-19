import { AccountTaskStatus, PaymentsAccountRecord } from '@karya/core';
import { BoxRouteMiddleware } from '../routes/BoxRoutes';
import { RegistrationQWrapper } from '../Queue/Registration/RegistrationQWrapper';
import { RegistrationQConfig } from '../Queue/Registration/RegistrationQConfig';
import * as HttpResponse from '@karya/http-response';
import { BasicModel, WorkerModel } from '@karya/common';
import { worker } from 'cluster';

export const addAccount: BoxRouteMiddleware = async (ctx) => {
  // TODO: Need to validate incoming request
  try {
    const accountRecord: PaymentsAccountRecord = ctx.request.body;
    const registrationQWrapper = new RegistrationQWrapper(RegistrationQConfig);
    const qResult = await registrationQWrapper.enqueue(accountRecord.id, {
      accountRecord: { ...accountRecord },
      boxId: ctx.state.entity.id,
    });
    HttpResponse.OK(ctx, qResult.createdAccountRecord);
  } catch (err) {
    // TODO: Handle different type of error and send appropriate response
    console.error(err);
    HttpResponse.InternalError(ctx, 'Could not enqueue task. Something went wrong');
  }
};

export const verifyAccount: BoxRouteMiddleware = async (ctx, next) => {
  // TODO: Need to validate incoming request
  // Validate Request
  // Verify if account exits
  console.log(ctx.request.body);
  const workerId = ctx.request.body.workerId;
  const accountId = ctx.params.id;
  const confirm = ctx.request.body.confirm;

  let accountRecord: PaymentsAccountRecord;
  try {
    accountRecord = await BasicModel.getSingle('payments_account', { id: accountId });
  } catch (err) {
    HttpResponse.BadRequest(ctx, 'Account Id is not valid');
    return;
  }

  // Verify if account is associated with the worker
  if (accountRecord!.worker_id != workerId) {
    HttpResponse.BadRequest(ctx, 'Account Id is not associated with the worker');
  }

  // Verify if the account needs to be verified
  if (accountRecord!.status != AccountTaskStatus.VERIFICATION) {
    HttpResponse.BadRequest(ctx, `Provided account id has the status ${accountRecord!.status}`);
    return;
  }

  try {
    let updatedAccountRecord: PaymentsAccountRecord;
    // Change status to verified if worker has confirmed the transaction
    if (confirm) {
      updatedAccountRecord = await BasicModel.updateSingle(
        'payments_account',
        { id: accountId },
        { status: AccountTaskStatus.VERIFIED }
      );
    } else {
      updatedAccountRecord = await BasicModel.updateSingle(
        'payments_account',
        { id: accountId },
        { status: AccountTaskStatus.REJECTED }
      );
    }
    HttpResponse.OK(ctx, updatedAccountRecord);
  } catch (err) {
    // TODO: Handle different type of error and send appropriate response
    console.error(err);
    HttpResponse.InternalError(ctx, 'Could not update the account status. Something went wrong.');
  }
};

/**
 * Get Updated Account Records for a particular box
 * @param ctx
 * @param next
 */
export const getUpdatedAccountRecords: BoxRouteMiddleware = async (ctx, next) => {
  // TODO @query: Check if it is ctx.request.query.from
  let from = ctx.query.from || new Date(0).toISOString();
  if (from instanceof Array) from = from[0];

  let limitString = ctx.query.limit;
  if (limitString instanceof Array) limitString = limitString[0];
  const limit = limitString ? Number.parseInt(limitString) : undefined;

  const updatedRecords = await BasicModel.getRecords(
    'payments_account',
    { box_id: ctx.state.entity.id },
    [],
    [['last_updated_at', from, null]],
    'last_updated_at',
    limit
  );
  HttpResponse.OK(ctx, updatedRecords);
};

/**
 * Get Updated Transaction Records for a particular box
 * @param ctx
 * @param next
 */
export const getUpdatedTransactionRecords: BoxRouteMiddleware = async (ctx, next) => {
  let from = ctx.query.from || new Date(0).toISOString();
  if (from instanceof Array) from = from[0];

  let limitString = ctx.query.limit;
  if (limitString instanceof Array) limitString = limitString[0];
  const limit = limitString ? Number.parseInt(limitString) : undefined;

  const updatedRecords = await BasicModel.getRecords(
    'payments_transaction',
    { box_id: ctx.state.entity.id },
    [],
    [['last_updated_at', from, null]],
    'last_updated_at',
    limit
  );
  return HttpResponse.OK(ctx, updatedRecords);
};
