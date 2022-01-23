import { Payload, QResult, BullQconfig } from '@karya/common';
import { Currency, PaymentMode, TransactionPurpose, PaymentsTransactionRecord } from '@karya/core';

export interface TransactionQPayload extends Payload {
  bulk_id?: string;
  boxId: string;
  amount: number;
  accountId: string;
  fundId: string;
  workerId: string;
  currency: Currency;
  mode: PaymentMode;
  purpose: TransactionPurpose;
  idempotencyKey: string;
}

export type TransactionQJobData = {
  transactionRecord: PaymentsTransactionRecord;
  fundId: string;
};

export interface TransactionQResult extends QResult {
  createdTransactionRecord: PaymentsTransactionRecord;
}

export interface TransactionQconfig extends BullQconfig {
  adminAccountNumber: string;
}
