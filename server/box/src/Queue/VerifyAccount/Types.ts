import { Payload, QResult } from '@karya/common';
import { PaymentsAccountRecord } from '@karya/core';
import { QueueOptions } from 'bullmq';

export interface VerifyAccountQPayload extends Payload {
  confirm: boolean;
  workerId: string;
  accountId: string;
}

export type VerifyAccountQJobData = VerifyAccountQPayload;

export type Qconfig = {
  qname: string;
  opts: QueueOptions;
};

export interface VerifyAccountQResult extends QResult {
  updatedAccountRecord: PaymentsAccountRecord;
}
