import { PaymentsTransactionRecord, WorkerRecord } from '@karya/core';

// type for payment eligible workers response

export type PaymentEligibleWorkerRecord = WorkerRecord & {
  amount: number,
  unique_id: string
};

export type PaymentsTransactionTable = PaymentsTransactionRecord & {
  unique_id: string,
  failure_reason: string
}

export declare type ViewName = 'payments_eligible_worker' | 'payments_transaction_table';

export declare type ViewRecordType<T extends ViewName> = T extends 'payments_eligible_worker'
  ? PaymentEligibleWorkerRecord
  : T extends 'payments_transaction_table'
  ? PaymentsTransactionTable
  : never;
