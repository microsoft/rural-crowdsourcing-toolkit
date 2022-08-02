import { BasicModel, setupDbConnection } from '@karya/common';
import { AccountTaskStatus, PaymentsAccountRecord } from '@karya/core';
import { Job } from 'bullmq';
import { qAxios } from '../../HttpUtils';
import { VerifyAccountQJobData } from '../Types';

// Setting up Db Connection
setupDbConnection();

export default async (job: Job<VerifyAccountQJobData>) => {
  try {
    await processJob(job);
  } catch (error) {
    await cleanUpOnError(error, job);
    throw error;
  }
};

const processJob = async (job: Job<VerifyAccountQJobData>) => {
  const accountRecord = job.data.accountRecord;
  const jobData = job.data;
  // set request header
  const box = (await BasicModel.getRecords('box', {}))[0];
  const headers = { 'karya-id-token': box.id_token! };
  // Make the request
  const response = await qAxios.put<PaymentsAccountRecord>(
    `api_box/payments/accounts/${accountRecord.id}/verify`,
    {
      workerId: accountRecord.worker_id,
      confirm: jobData.confirm,
    },
    { headers: headers }
  );
  BasicModel.updateSingle('payments_account', { id: accountRecord.id }, { ...response.data });
};

const cleanUpOnError = async (error: any, job: Job<VerifyAccountQJobData>) => {
  const accountRecord = job.data.accountRecord;
  const meta = accountRecord.meta;
  const record = await BasicModel.updateSingle(
    'payments_account',
    { id: accountRecord.id },
    {
      status: AccountTaskStatus.CONFIRMATION_FAILED,
      meta: {
        ...meta,
        failure_server: 'box',
        failure_source: 'Verify Account Processor',
        failure_reason: error.message,
      },
    }
  );
};
