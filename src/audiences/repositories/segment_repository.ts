import { eq } from "drizzle-orm"

import type { DrizzleClient } from "@/database/client.ts"
import type {
  InsertSegment,
  Segment,
} from "@/database/schema/database_schema_types.js"
import { segments } from "@/database/schema/schema.js"

import { makeDatabase } from "@/shared/container/index.js"
import { BaseRepository } from "@/shared/repositories/base_repository.js"

export class SegmentRepository extends BaseRepository {
  constructor(protected database: DrizzleClient = makeDatabase()) {
    super()
  }

  async create(payload: InsertSegment) {
    const result = await this.database
      .insert(segments)
      .values({ ...payload })

    return { id: this.primaryKey(result) }
  }

  async delete(segmentId: number) {
    await this.database.delete(segments).where(eq(segments.id, segmentId))

    return { id: segmentId }
  }

  async findById(segmentId: number) {
    const [segment] = await this.database
      .select()
      .from(segments)
      .where(eq(segments.id, segmentId))

    return segment
  }
}
