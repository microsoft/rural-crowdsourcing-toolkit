import { Payload, QResult } from "@karya/common";
import { BulkPaymentsTransactionRecord } from "@karya/core";
import { QueueOptions } from "bullmq";

export interface BulkTransactionQPayload extends Payload {
    userId: string,
    n_workers: number,
    amount: number,
}

export type BulkTransactionQJobData = {
    bulkTransactionRecord: BulkPaymentsTransactionRecord
}

export type Qconfig = {
    qname: string
    opts: QueueOptions
}

export interface BulkTransactionQResult extends QResult{
    createdBulkTransactionRecord: BulkPaymentsTransactionRecord
}