import { type SQL, type SQLWrapper, and, asc, eq, sql } from "drizzle-orm"

import { SegmentBuilder } from "@/audiences/utils/segment_builder/segment_builder.js"

import type { DrizzleClient } from "@/database/client.js"
import type { BroadcastWithSegmentAndAbTestVariants } from "@/database/schema/database_schema_types.js"
import { contacts } from "@/database/schema/schema.js"

export class ContactsConcern {
  database: DrizzleClient

  broadcast: BroadcastWithSegmentAndAbTestVariants

  filterContactsQuery(): SQL | undefined {
    const segmentQueryConditions: SQLWrapper[] = []

    if (this.broadcast.segment) {
      segmentQueryConditions.push(
        new SegmentBuilder(this.broadcast.segment.filterGroups).build(),
      )
    }

    return and(
      eq(contacts.audienceId, this.broadcast.audience.id),
      ...segmentQueryConditions,
    )
  }

  async getContactIds(offSet: number, limit: number) {
    return this.database
      .select({ id: contacts.id })
      .from(contacts)
      .where(this.filterContactsQuery())
      .orderBy(asc(contacts.id))
      .limit(limit)
      .offset(offSet)
  }
}
