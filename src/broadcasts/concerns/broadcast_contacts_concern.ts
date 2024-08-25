import type { CreateSegmentDto } from '@/audiences/dto/segments/create_segment_dto.ts'
import { SegmentBuilder } from '@/audiences/utils/segment_builder/segment_builder.ts'
import type { DrizzleClient } from '@/database/client.ts'
import { contacts } from '@/database/schema/schema.ts'
import type { BroadcastWithSegmentAndAbTestVariants } from '@/database/schema/database_schema_types.js'
import { and, asc, eq, type SQL, sql, type SQLWrapper } from 'drizzle-orm'

export class ContactsConcern {
  database: DrizzleClient

  broadcast: BroadcastWithSegmentAndAbTestVariants

  filterContactsQuery(): SQL | undefined {
    const segmentQueryConditions: SQLWrapper[] = []

    if (this.broadcast.segment) {
      segmentQueryConditions.push(
        new SegmentBuilder(
          this.broadcast.segment.conditions as CreateSegmentDto['conditions'],
        ).build(),
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
