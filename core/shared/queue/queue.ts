import { Queue as BullQueue } from 'bullmq'
import { AVAILABLE_QUEUES } from './config.js'

import { makeRedis } from '#root/core/shared/container/index.js'

export const BroadcastsQueue = () =>
  new BullQueue(AVAILABLE_QUEUES.broadcasts, {
    connection: makeRedis(),
  })

export const AbTestsBroadcastsQueue = () =>
  new BullQueue(AVAILABLE_QUEUES.abtests_broadcasts, {
    connection: makeRedis(),
  })

export const AutomationsQueue = () =>
  new BullQueue(AVAILABLE_QUEUES.automations, {
    connection: makeRedis(),
  })

export const AccountsQueue = () =>
  new BullQueue(AVAILABLE_QUEUES.accounts, {
    connection: makeRedis(),
  })

export const TransactionalQueue = () =>
  new BullQueue(AVAILABLE_QUEUES.transactional, {
    connection: makeRedis(),
  })

export const SendingDomainsQueue = () =>
  new BullQueue(AVAILABLE_QUEUES.sending_domains, {
    connection: makeRedis(),
  })

export const ContactsQueue = () =>
  new BullQueue(AVAILABLE_QUEUES.contacts, {
    connection: makeRedis(),
  })

export const MtaLogsQueue = () =>
  new BullQueue(AVAILABLE_QUEUES.mta_logs, {
    connection: makeRedis(),
  })

export const WebsitesQueue = () =>
  new BullQueue(AVAILABLE_QUEUES.websites, {
    connection: makeRedis(),
  })

export const AuthQueue = () =>
  new BullQueue(AVAILABLE_QUEUES.auth, {
    connection: makeRedis(),
  })

export class Queues {
  broadcasts = BroadcastsQueue
  abTestsBroadcasts = AbTestsBroadcastsQueue
  automations = AutomationsQueue
  accounts = AccountsQueue
  transactional = TransactionalQueue
  sending_domains = SendingDomainsQueue
  contacts = ContactsQueue
  mta_logs = MtaLogsQueue
  websites = WebsitesQueue
  auth = AuthQueue
}

export const Queue = new Queues()
