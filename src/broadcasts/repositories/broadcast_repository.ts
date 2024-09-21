import { eq, sql } from "drizzle-orm"
import { alias } from "drizzle-orm/mysql-core"

import type { CreateBroadcastDto } from "@/broadcasts/dto/create_broadcast_dto.js"

import type { DrizzleClient } from "@/database/client.js"
import type {
  BroadcastWithEmailContent,
  EmailContent,
  UpdateSetBroadcastInput,
} from "@/database/schema/database_schema_types.js"
import {
  abTestVariants,
  audiences,
  broadcasts,
  emailContents,
  segments,
} from "@/database/schema/schema.js"

import { makeDatabase } from "@/shared/container/index.js"
import { BaseRepository } from "@/shared/repositories/base_repository.js"

export class BroadcastRepository extends BaseRepository {
  constructor(protected database: DrizzleClient = makeDatabase()) {
    super()
  }

  async create(data: CreateBroadcastDto, teamId: string) {
    const id = this.cuid()
    await this.database.insert(broadcasts).values({ ...data, teamId, id })

    return { id }
  }

  async update(
    id: string,
    { sendAt, ...payload }: Partial<UpdateSetBroadcastInput>,
  ) {
    await this.database
      .update(broadcasts)
      .set({
        ...payload,
        ...(sendAt ? { sendAt: new Date(sendAt as string) } : {}),
      })
      .where(eq(broadcasts.id, id))
    return { id }
  }

  async delete(id: string) {
    await this.database.delete(broadcasts).where(eq(broadcasts.id, id))

    return { id }
  }

  async findByIdWithAbTestVariants(id: string) {
    const broadcastEmailContents = alias(
      emailContents,
      "broadcastEmailContents",
    )
    const results = await this.database
      .select({
        broadcast: broadcasts,
        abTestVariant: abTestVariants,
        emailContent: emailContents,
        segment: segments,
        audience: audiences,
        broadcastEmailContent: broadcastEmailContents,
      })
      .from(broadcasts)
      .leftJoin(segments, eq(broadcasts.segmentId, segments.id))
      .leftJoin(audiences, eq(broadcasts.audienceId, audiences.id))
      .leftJoin(
        broadcastEmailContents,
        eq(broadcastEmailContents.id, broadcasts.emailContentId),
      )
      .leftJoin(
        abTestVariants,
        eq(abTestVariants.broadcastId, broadcasts.id),
      )
      .leftJoin(
        emailContents,
        eq(emailContents.id, abTestVariants.emailContentId),
      )
      .where(eq(broadcasts.id, id))

    if (results.length === 0) {
      return null
    }

    const broadcast = results[0].broadcast
    const segment = results[0]?.segment
    const audience = results[0]?.audience
    const broadcastEmailContent = results[0]?.broadcastEmailContent
    const variants = results
      .map((result) => ({
        ...result.abTestVariant,
        emailContent: result.emailContent as EmailContent,
      }))
      .filter((variant) => variant.id !== null)

    return {
      ...broadcast,
      segment,
      audience,
      abTestVariants: variants,
      emailContent: broadcastEmailContent,
    }
  }

  async findById(id: string) {
    const results = await this.database
      .select()
      .from(broadcasts)
      .where(eq(broadcasts.id, id))
      .limit(1)

    return results?.[0]
  }

  async findAll() {
    return this.database.select().from(broadcasts).limit(100)
  }
}
