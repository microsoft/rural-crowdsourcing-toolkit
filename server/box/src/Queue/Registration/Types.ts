import { Payload, QResult } from "@karya/common";
import { PaymentsAccountRecord } from "@karya/core";
import { QueueOptions } from "bullmq";

export interface RegistrationQPayload extends Payload {
    name: string,
    workerID: string,
    accountType: string,
    accountDetails: {
        id: string,
        ifsc?: string
    },
    hash: string,

}

export type RegistrationQJobData = {
    account_record_id: string
}

export type Qconfig = {
    opts: QueueOptions
}

export interface RegistrationQResult extends QResult{
    createdAccountRecord: PaymentsAccountRecord
}