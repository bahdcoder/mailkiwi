import { Queue } from 'bullmq'
import { AVAILABLE_QUEUES } from './config.ts'

const connection = { host: 'localhost', port: 6379 }

export const BroadcastsQueue = new Queue(AVAILABLE_QUEUES.broadcasts, {
  connection,
})

export const AutomationsQueue = new Queue(AVAILABLE_QUEUES.automations, {
  connection,
})

export const AccountsQueue = new Queue(AVAILABLE_QUEUES.accounts, {
  connection,
})

export const TransactionalQueue = new Queue(AVAILABLE_QUEUES.transactional, {
  connection,
})
