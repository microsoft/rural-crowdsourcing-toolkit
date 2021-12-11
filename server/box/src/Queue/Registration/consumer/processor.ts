import { BasicModel, setupDbConnection } from "@karya/common";
import { AccountTaskStatus, PaymentsAccountRecord } from "@karya/core";
import { Job } from "bullmq";
import { qAxios } from "../../HttpUtils";
import { RegistrationQJobData } from "../Types";

const SERVER_ADD_ACCOUNT_RELATIVE_URL = 'api_box/payments/accounts'

// Setting up Db Connection
setupDbConnection();

export default async (job: Job<RegistrationQJobData>) => {
    // Get the box record
    // TODO: Maybe cache the id_token rather than calling the database every time
    let accountRecord: PaymentsAccountRecord
    try {
        const box = (await BasicModel.getRecords('box', {}))[0];

        accountRecord = await BasicModel.getSingle('payments_account', { id: job.data.account_record_id })
        // set request header
        const headers = { 'karya-id-token': box.id_token }
        qAxios.defaults.headers = headers
        // send the post request
        const response = await qAxios.post<PaymentsAccountRecord>(SERVER_ADD_ACCOUNT_RELATIVE_URL, accountRecord)
        BasicModel.updateSingle('payments_account', { id: job.data.account_record_id }, { ...response.data })
    } catch (e) {

        // TODO: Handle error for the case where accountRecord cannot be fetched from database
        // Possible Handling: Move the job to failed stage and keep retrying
        // sending the account record for registration

        // TODO: Log the error here
        console.log(e)
        let updatedRecordMeta = accountRecord!.meta
        // Update the record to status failed with faluire reason
        // TODO: Set the type of meta to be any
        // @ts-ignore adding property to meta field
        updatedRecordMeta["failure_reason"] = `Failure inside Registration Account Queue Processor at box | ${e.message}`;
        BasicModel.updateSingle('payments_account', { id: job.data.account_record_id}, { status: AccountTaskStatus.FAILED, meta: updatedRecordMeta })
    }
}