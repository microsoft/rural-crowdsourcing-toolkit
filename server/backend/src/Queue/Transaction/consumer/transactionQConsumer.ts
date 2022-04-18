import { Worker } from 'bullmq';
import { TransactionQconfigObject } from '../TransactionQconfigObject';
import ConsumerConfig from './ConsumerConfig';

export const transactionQConsumer = new Worker(
  TransactionQconfigObject.qname,
  ConsumerConfig.processor_path,
  ConsumerConfig.opts
);
