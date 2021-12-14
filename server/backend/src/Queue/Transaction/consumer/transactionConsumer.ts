import { Worker } from 'bullmq'
import { TransactionQConfig } from '../TransactionQConfig'
import ConsumerConfig from './ConsumerConfig'

export const transactionConsumer = new Worker(
    TransactionQConfig.qname,
    ConsumerConfig.processor_path,
    ConsumerConfig.opts
)