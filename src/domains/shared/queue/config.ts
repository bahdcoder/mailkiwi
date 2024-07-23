export const AVAILABLE_QUEUES = {
  broadcasts: 'broadcasts',
  transactional: 'transactional',
  automations: 'automations',
} as const

export type AVAILABLE_QUEUE_TYPE = keyof typeof AVAILABLE_QUEUES
