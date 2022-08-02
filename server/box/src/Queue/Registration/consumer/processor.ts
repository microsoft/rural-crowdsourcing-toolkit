import { BasicModel, setupDbConnection } from '@karya/common';
import { AccountTaskStatus, PaymentsAccountRecord } from '@karya/core';
import { Job } from 'bullmq';
import { qAxios } from '../../HttpUtils';
import { RegistrationQJobData } from '../Types';

const SERVER_ADD_ACCOUNT_RELATIVE_URL = 'api_box/payments/accounts';

// Setting up Db Connection
setupDbConnection();

export default async (job: Job<RegistrationQJobData>) => {
  try {
    await processJob(job);
  } catch (error) {
    await cleanUpOnError(error, job);
    throw error;
  }
};

const processJob = async (job: Job<RegistrationQJobData>) => {
  const box = (await BasicModel.getRecords('box', {}))[0];

  const accountRecord = job.data.accountRecord;
  // set request header
  const headers = { 'karya-id-token': box.id_token! };
  // send the post request
  const response = await qAxios.post<PaymentsAccountRecord>(SERVER_ADD_ACCOUNT_RELATIVE_URL, accountRecord, {
    headers: headers,
  });
  await BasicModel.updateSingle('payments_account', { id: accountRecord.id }, { ...response.data });
};

const cleanUpOnError = async (error: any, job: Job<RegistrationQJobData>) => {
  // Possible Handling: Move the job to failed stage and keep retrying
  // sending the account record for registration

  const accountRecord = job.data.accountRecord;
  const meta = accountRecord.meta;
  await BasicModel.updateSingle(
    'payments_account',
    { id: accountRecord.id },
    {
      status: AccountTaskStatus.FAILED,
      meta: {
        ...meta,
        failure_server: 'box',
        failure_source: 'Registration Account Queue',
        failure_reason: error.message,
      },
    }
  );
};
