import { eq } from 'drizzle-orm'

import type { DrizzleClient } from '#root/database/client.js'
import type { InsertSegment } from '#root/database/database_schema_types.js'
import { segments } from '#root/database/schema.js'

import { makeDatabase } from '#root/core/shared/container/index.js'
import { BaseRepository } from '#root/core/shared/repositories/base_repository.js'

export class SegmentRepository extends BaseRepository {
  constructor(protected database: DrizzleClient = makeDatabase()) {
    super()
  }

  segments() {
    return this.crud(segments)
  }

  async create(payload: InsertSegment) {
    const id = this.cuid()
    await this.database.insert(segments).values({ id, ...payload })

    return { id }
  }

  async delete(segmentId: string) {
    await this.database.delete(segments).where(eq(segments.id, segmentId))

    return { id: segmentId }
  }

  async findById(segmentId: string) {
    const [segment] = await this.database
      .select()
      .from(segments)
      .where(eq(segments.id, segmentId))

    return segment
  }
}
