import { BasicModel, setupDbConnection } from '@karya/common';
import { PaymentsAccountRecord } from '@karya/core';
import { Job } from 'bullmq';
import { qAxios } from '../../HttpUtils';
import { VerifyAccountQJobData } from '../Types';

// Setting up Db Connection
setupDbConnection();

export default async (job: Job<VerifyAccountQJobData>) => {
  const jobData = job.data;

  const relativeUrl = `api_box/payments/accounts/${jobData.accountId}/verify`;
  // set request header
  const box = (await BasicModel.getRecords('box', {}))[0];
  const headers = { 'karya-id-token': box.id_token! };
  // Make the request
  const response = await qAxios.put<PaymentsAccountRecord>(
    relativeUrl,
    {
      workerId: jobData.workerId,
      confirm: jobData.confirm,
    },
    { headers: headers }
  );
  BasicModel.updateSingle('payments_account', { id: jobData.accountId }, { ...response.data });
};
