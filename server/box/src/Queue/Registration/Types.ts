import { Payload, QResult } from '@karya/common';
import { PaymentsAccountRecord } from '@karya/core';
import { QueueOptions } from 'bullmq';

export interface RegistrationQPayload extends Payload {
  boxId: string;
  name: string;
  workerID: string;
  accountType: string;
  accountDetails: {
    id: string;
    ifsc?: string;
  };
  hash: string;
}

export type RegistrationQJobData = {
  accountRecord: PaymentsAccountRecord;
};

export type Qconfig = {
  qname: string;
  opts: QueueOptions;
};

export interface RegistrationQResult extends QResult {
  createdAccountRecord: PaymentsAccountRecord;
}
