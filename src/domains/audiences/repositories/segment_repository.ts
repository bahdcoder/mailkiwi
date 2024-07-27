import { eq } from 'drizzle-orm'

import { BaseRepository } from '@/domains/shared/repositories/base_repository.js'
import { segments } from '@/infrastructure/database/schema/schema.js'
import type {
  InsertSegment,
  Segment,
} from '@/infrastructure/database/schema/types.ts'
import type { DrizzleClient } from '@/infrastructure/database/client.ts'
import { makeDatabase } from '@/infrastructure/container.ts'

export class SegmentRepository extends BaseRepository {
  constructor(protected database: DrizzleClient = makeDatabase()) {
    super()
  }

  async create(payload: InsertSegment) {
    const id = this.cuid()

    await this.database.insert(segments).values({ ...payload, id })

    return { id }
  }

  async delete(segmentId: string) {
    await this.database.delete(segments).where(eq(segments.id, segmentId))
    return { id: segmentId }
  }

  findById(segmentId: string) {
    return this.database.query.segments.findFirst({
      where: eq(segments.id, segmentId),
    })
  }
}
