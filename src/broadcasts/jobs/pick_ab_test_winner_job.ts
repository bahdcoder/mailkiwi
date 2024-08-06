import { BaseJob, type JobContext } from "@/shared/queue/abstract_job.js";
import { AVAILABLE_QUEUES } from "@/shared/queue/config.js";

import { BroadcastsQueue } from "@/shared/queue/queue.js";
import { broadcasts, contacts, sends } from "@/database/schema/schema.js";
import {
  and,
  asc,
  count,
  eq,
  SelectedFields,
  sql,
  type SQLWrapper,
} from "drizzle-orm";
import { SendBroadcastToContact } from "./send_broadcast_to_contact_job.js";

import { SegmentBuilder } from "@/audiences/utils/segment_builder/segment_builder.ts";
import type { CreateSegmentDto } from "@/audiences/dto/segments/create_segment_dto.ts";
import { MySqlSelectBase, MySqlSelectBuilder } from "drizzle-orm/mysql-core";

export interface PickAbTestWinnerJobPayload {
  broadcastId: string;
}

export class PickAbTestWinnerJob extends BaseJob<PickAbTestWinnerJobPayload> {
  static get id() {
    return "ABTESTS_BROADCASTS::PICK_AB_TEST_WINNER";
  }

  static get queue() {
    return AVAILABLE_QUEUES.abtests_broadcasts;
  }

  async handle({ database, payload }: JobContext<PickAbTestWinnerJobPayload>) {
    return this.done();
  }
}
