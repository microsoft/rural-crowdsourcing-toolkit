import { Payload, QResult } from "@karya/common";
import { PaymentsAccountRecord } from "@karya/core";
import { QueueOptions } from "bullmq";

export interface RegistrationQPayload extends Payload {
    accountRecord: PaymentsAccountRecord
}

export type RegistrationQJobData = {
    accountRecord: PaymentsAccountRecord
}

export type Qconfig = {
    qname: string
    opts: QueueOptions
}

export interface RegistrationQResult extends QResult{
    createdAccountRecord: PaymentsAccountRecord
}