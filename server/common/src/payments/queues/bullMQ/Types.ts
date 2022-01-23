import { QueueOptions } from 'bullmq';

export type BullQconfig = {
  qname: string;
  opts: QueueOptions;
};
