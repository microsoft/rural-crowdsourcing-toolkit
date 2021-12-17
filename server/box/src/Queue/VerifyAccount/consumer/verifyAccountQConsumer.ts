import { Worker } from 'bullmq'
import { VerifyAccountQConfig } from '../VerifyAccountQConfig'
import ConsumerConfig from './ConsumerConfig'

export const verifyAccountQConsumer = new Worker(
    VerifyAccountQConfig.qname,
    ConsumerConfig.processor_path,
    ConsumerConfig.opts
)