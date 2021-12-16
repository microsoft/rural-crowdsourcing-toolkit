import { Worker } from 'bullmq'
import { RegistrationQConfig } from '../RegistrationQConfig'
import ConsumerConfig from './ConsumerConfig'

export const registrationConsumer = new Worker(
    RegistrationQConfig.qname,
    ConsumerConfig.processor_path,
    ConsumerConfig.opts
)