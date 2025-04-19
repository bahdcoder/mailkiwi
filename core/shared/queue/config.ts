export const AVAILABLE_QUEUES = {
  abtests_broadcasts: 'abtests_broadcasts',
  broadcasts: 'broadcasts',
  transactional: 'transactional',
  automations: 'automations',
  accounts: 'accounts',
  sending_domains: 'sending_domains',
  websites: 'websites',
  contacts: 'contacts',
  mta_logs: 'mta_logs',
  auth: 'auth',
} as const

export type AVAILABLE_QUEUE_TYPE = keyof typeof AVAILABLE_QUEUES
