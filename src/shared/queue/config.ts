export const AVAILABLE_QUEUES = {
  abtests_broadcasts: "abtests_broadcasts",
  broadcasts: "broadcasts",
  transactional: "transactional",
  automations: "automations",
  accounts: "accounts",
} as const;

export type AVAILABLE_QUEUE_TYPE = keyof typeof AVAILABLE_QUEUES;
