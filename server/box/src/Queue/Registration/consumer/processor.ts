import { BasicModel, setupDbConnection } from '@karya/common';
import { AccountTaskStatus, PaymentsAccountRecord } from '@karya/core';
import { Job } from 'bullmq';
import { qAxios } from '../../HttpUtils';
import { RegistrationQJobData } from '../Types';

const SERVER_ADD_ACCOUNT_RELATIVE_URL = 'api_box/payments/accounts';

// Setting up Db Connection
setupDbConnection();

export default async (job: Job<RegistrationQJobData>) => {
  // Get the box record
  // TODO: Maybe cache the id_token rather than calling the database every time
  let accountRecord: PaymentsAccountRecord;
  try {
    const box = (await BasicModel.getRecords('box', {}))[0];

    accountRecord = await BasicModel.getSingle('payments_account', { id: job.data.account_record_id });
    // set request header
    const headers = { 'karya-id-token': box.id_token! };
    // send the post request
    const response = await qAxios.post<PaymentsAccountRecord>(SERVER_ADD_ACCOUNT_RELATIVE_URL, accountRecord, {
      headers: headers,
    });
    await BasicModel.updateSingle('payments_account', { id: job.data.account_record_id }, { ...response.data });
  } catch (e: any) {
    // TODO: Handle error for the case where accountRecord cannot be fetched from database
    // Possible Handling: Move the job to failed stage and keep retrying
    // sending the account record for registration

    // TODO: Log the error here
    console.log(e);
    const accountsId = job.data.account_record_id;

    const updatedAccountRecord = await BasicModel.getSingle('payments_account', { id: accountsId });
    // @ts-ignore adding property to meta field
    const updatedMeta = updatedAccountRecord.meta;
    const reason = `Failure inside Registration Account Queue Processor at box | ${e.message}`;
    // @ts-ignore
    updatedMeta['failure_reason'] = reason;
    await BasicModel.updateSingle(
      'payments_account',
      { id: accountsId },
      { status: AccountTaskStatus.FAILED, meta: { meta: updatedMeta } }
    );
  }
};
