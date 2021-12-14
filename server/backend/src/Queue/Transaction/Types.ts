import { Payload, QResult } from "@karya/common";
import { Currency, PaymentMode, TransactionPurpose, PaymentsTransactionRecord } from "@karya/core";
import { QueueOptions } from "bullmq";

export interface TransactionQPayload extends Payload {
    amount: number,
    accountId: string,
    fundId: string,
    workerId: string,
    currency: Currency
    mode: PaymentMode
    purpose: TransactionPurpose
    idempotencyKey: number
}

export type TransactionQJobData = {
    transactionRecord: PaymentsTransactionRecord
    fundId: string
}

export type Qconfig = {
    qname: string
    adminAccountNumber: string,
    opts: QueueOptions
}

export interface TransactionQResult extends QResult{
    createdTransactionRecord: PaymentsTransactionRecord
}