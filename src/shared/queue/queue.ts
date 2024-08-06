import { Queue } from "bullmq";
import { AVAILABLE_QUEUES } from "./config.js";
import { Redis } from "ioredis";
import { env } from "@/shared/env/index.ts";

const connection = new Redis(env.REDIS_URL);

export const BroadcastsQueue = new Queue(AVAILABLE_QUEUES.broadcasts, {
  connection,
});

export const AbTestsBroadcastsQueue = new Queue(
  AVAILABLE_QUEUES.abtests_broadcasts,
  {
    connection,
  },
);

export const AutomationsQueue = new Queue(AVAILABLE_QUEUES.automations, {
  connection,
});

export const AccountsQueue = new Queue(AVAILABLE_QUEUES.accounts, {
  connection,
});

export const TransactionalQueue = new Queue(AVAILABLE_QUEUES.transactional, {
  connection,
});
