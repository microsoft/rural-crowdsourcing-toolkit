import { BasicModel, setupDbConnection } from "@karya/common";
import { AccountTaskStatus, PaymentsAccountRecord } from "@karya/core";
import { Job } from "bullmq";
import { qAxios } from "../../HttpUtils";
import { VerifyAccountQJobData } from "../Types";

// Setting up Db Connection
setupDbConnection();

export default async (job: Job<VerifyAccountQJobData>) => {

    const jobData = job.data
    // send the post request
    
    const relativeUrl = `api_box/payments/accounts/${jobData.accountId}/verify`
    const response = await qAxios.put<PaymentsAccountRecord>(relativeUrl, { 
        workerId: jobData.workerId,
        confirm: jobData.confirm
    })
    BasicModel.updateSingle('payments_account', { id: jobData.accountId }, { ...response.data })
}