import { Worker } from 'bullmq'
import { BulkTransactionQConfig } from '../BulkTransactionQConfig'
import ConsumerConfig from './ConsumerConfig'

export const bulkTransactionQConsumer = new Worker(
    BulkTransactionQConfig.qname,
    ConsumerConfig.processor_path,
    ConsumerConfig.opts
)