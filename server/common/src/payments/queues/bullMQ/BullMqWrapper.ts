import { QueueWrapper } from '../common/QueueWrapper';
import { Queue as BullMQ } from 'bullmq';
import { BullQconfig } from './Types';

export abstract class BullMqWrapper<T> extends QueueWrapper<BullMQ> {
  constructor(config: BullQconfig) {
    super(config);
  }

  intialiseQueue(): void {
    this.queue = new BullMQ<T>(this.config.qname, this.config.opts);
  }

  close(): void {
    this.queue.close();
  }
}
