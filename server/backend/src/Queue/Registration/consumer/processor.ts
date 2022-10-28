import { BasicModel, setupDbConnection } from '@karya/common';
import {
  FundAccountRequest,
  ContactsRequest,
  ContactsResponse,
  PaymentsAccountRecord,
  RecordNotFoundError,
  WorkerRecord,
  FundAccountResponse,
  AccountTaskStatus,
} from '@karya/core';
import { Job } from 'bullmq';
import { AxiosResponse } from 'axios';
import { razorPayAxios } from '../../HttpUtils';
import { RegistrationQJobData } from '../Types';
import { TransactionQconfigObject } from '../../Transaction/TransactionQconfigObject';
import { TransactionQWrapper } from '../../Transaction/TransactionQWrapper';
import { TransactionQPayload } from '../../Transaction/Types';
import { ErrorLogger } from '../Utils';

const RAZORPAY_CONTACTS_RELATIVE_URL = 'contacts';
const RAZORPAY_FUND_ACCOUNT_RELATIVE_URL = 'fund_accounts';

// Setting up Db Connection
setupDbConnection();

export default async (job: Job<RegistrationQJobData>) => {
  try {
    await processJob(job);
  } catch (error: any) {
    ErrorLogger.error(`Registration Id ${job.data.accountRecord.id}: Error Stack: ${error.stack}`);
    await cleanUpOnError(error, job);
    throw error;
  }
};

const processJob = async (job: Job<RegistrationQJobData>) => {
  // Get the box record
  // TODO @enhancement: Maybe cache the id_token rather than calling the database every time
  const accountRecord: PaymentsAccountRecord = job.data.accountRecord;
  const contactsId = await getContactsID(accountRecord.worker_id);
  let fundsId = await createFundsId(accountRecord, contactsId);

  // Update the worker record with the obtained contactsId
  await BasicModel.updateSingle(
    'worker',
    { id: accountRecord.worker_id },
    {
      selected_account: accountRecord.id,
      payments_meta: {
        contacts_id: contactsId,
      },
      tags_updated_at: new Date().toISOString(),
    }
  );

  // Update accountsMeta to remove account information
  const accountsMeta = accountRecord.meta;
  // Only include last 4 digit of account number
  // @ts-ignore
  accountsMeta.account.id = accountsMeta.account.id.slice(-4);
  // Update the account record with the obtained fund id
  const updatedAccountRecord = await BasicModel.updateSingle(
    'payments_account',
    { id: accountRecord.id },
    {
      ...accountRecord,
      fund_id: fundsId,
      active: true,
      status: AccountTaskStatus.SERVER_ACCOUNTS_QUEUE,
      meta: accountsMeta,
    }
  );

  // create and push a verification transaction task
  const transactionQWrapper = new TransactionQWrapper(TransactionQconfigObject);
  // TODO: @enhancement: Change the hard coded strings to enums
  const transactionMode = accountRecord.account_type === 'bank_account' ? 'IMPS' : 'UPI';
  const payload: TransactionQPayload = {
    boxId: accountRecord.box_id,
    accountId: accountRecord.id,
    amount: 2,
    currency: 'INR',
    fundId: fundsId,
    idempotencyKey: accountRecord.hash,
    mode: transactionMode,
    purpose: 'VERIFICATION',
    workerId: accountRecord.worker_id,
  };
  await transactionQWrapper.enqueue('VERIFICATION_TRANSACTION', payload);
  // Update the status of account record
  await BasicModel.updateSingle(
    'payments_account',
    { id: accountRecord.id },
    {
      ...accountRecord,
      fund_id: fundsId,
      active: true,
      status: AccountTaskStatus.TRANSACTION_QUEUE,
    }
  );
};

// TODO: @Refacotor: Maybe encapsulate these functions in a 'Razorpay' class
/**
 *
 * @param workerId
 * @returns contacts Id for the worker
 *
 */
const getContactsID = async (workerId: string) => {
  let workerRecord: WorkerRecord;
  try {
    workerRecord = await BasicModel.getSingle('worker', { id: workerId });
  } catch (e) {
    throw new RecordNotFoundError('Could not find worker record with given id in accounts record');
  }
  // Check if contactsId already exists in the worker record
  const payments_meta = workerRecord!.payments_meta;
  if (payments_meta && (payments_meta as any).contacts_id) {
    const contactsId = (payments_meta as any).contacts_id;
    return contactsId;
  }
  // Contacts ID doesnot exist, make a request to Razorpay
  // 1. Create the request body
  const contactsRequestBody: ContactsRequest = {
    name: workerId,
    contact: workerRecord.phone_number!,
    type: 'WORKER',
  };
  // 2. Make the post request
  // TODO @enhancement: Maybe rertry the request few times before marking the record as failed
  const response = await razorPayAxios.post<ContactsResponse>(RAZORPAY_CONTACTS_RELATIVE_URL, contactsRequestBody);

  // 3. Return the contactsId
  return response.data.id;
};

/**
 * Request fundsId from Razorpay
 * @param accountRecord
 * @param contactsId
 */
const createFundsId = async (accountRecord: PaymentsAccountRecord, contactsId: string) => {
  let fundAccountRequestBody: FundAccountRequest;
  // 1. Determine the account type and create appropriate request body
  if (accountRecord.account_type === 'bank_account') {
    fundAccountRequestBody = {
      account_type: 'bank_account',
      contact_id: contactsId,
      bank_account: {
        name: (accountRecord.meta as any).name,
        account_number: (accountRecord.meta as any).account.id,
        ifsc: (accountRecord.meta as any).account.ifsc,
      },
    };
  } else {
    fundAccountRequestBody = {
      account_type: 'vpa',
      contact_id: contactsId,
      vpa: {
        address: (accountRecord.meta as any).account.id,
      },
    };
  }

  // 2. Make the request to Razorpay
  let response: AxiosResponse<FundAccountResponse>;
  try {
    response = await razorPayAxios.post<FundAccountResponse>(
      RAZORPAY_FUND_ACCOUNT_RELATIVE_URL,
      fundAccountRequestBody
    );
  } catch (e: any) {
    throw new Error(e.response.data.error.description);
  }
  // 4. Return the fund account id
  return response.data.id;
};

const cleanUpOnError = async (error: any, job: Job<RegistrationQJobData>) => {
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
};
