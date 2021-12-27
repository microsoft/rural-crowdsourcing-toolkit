import { WorkerRecord } from "@karya/core"

// type for payment eligible workers response

export type PaymentEligibleWorkerRecord = (WorkerRecord & {amount: number})

export declare type ViewName = 'payments_eligible_worker';

export declare type ViewRecordType<T extends ViewName> = T extends 'payments_eligible_worker' ? PaymentEligibleWorkerRecord : never;
