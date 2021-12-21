import { Payload, QResult } from "@karya/common";
import { BulkPaymentsTransactionRecord, BulkTransactionRequest } from "@karya/core";
import { QueueOptions } from "bullmq";

export interface BulkTransactionQPayload extends Payload {
    userId: string,
    n_workers: number,
    amount: number,
    bulkTransactionRequest: BulkTransactionRequest
}

export type BulkTransactionQJobData = {
    bulkTransactionRecord: BulkPaymentsTransactionRecord,
    bulkTransactionRequest: BulkTransactionRequest
}

export type Qconfig = {
    qname: string
    opts: QueueOptions
}

export interface BulkTransactionQResult extends QResult{
    createdBulkTransactionRecord: BulkPaymentsTransactionRecord
}