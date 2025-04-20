import { type SQLWrapper, and, eq } from 'drizzle-orm'
import { alias } from 'drizzle-orm/mysql-core'

import type { CreateBroadcastDto } from '@/broadcasts/dto/create_broadcast_dto.js'

import type { DrizzleClient } from '@/database/client.js'
import type {
  Broadcast,
  BroadcastWithEmailContent,
  EmailContent,
  UpdateSetBroadcastInput,
} from '@/database/database_schema_types.js'
import {
  abTestVariants,
  audiences,
  broadcasts,
  contacts,
  emailContents,
  segments,
} from '@/database/schema.js'

import { AudienceRepository } from '@/audiences/repositories/audience_repository.js'
import { SegmentRepository } from '@/audiences/repositories/segment_repository.js'
import { SegmentBuilder } from '@/audiences/utils/segment_builder/segment_builder.js'
import { hasOne } from '@/database/utils/relationships.js'
import { makeDatabase } from '@/shared/container/index.js'
import { BaseRepository } from '@/shared/repositories/base_repository.js'
import { container } from '@/utils/typi.js'
import { DateTime } from 'luxon'

export class BroadcastRepository extends BaseRepository {
  constructor(protected database: DrizzleClient = makeDatabase()) {
    super()
  }

  protected hasOneEmailContent = hasOne(this.database, {
    from: broadcasts,
    to: emailContents,
    primaryKey: broadcasts.id,
    foreignKey: emailContents.id,
    relationName: 'emailContent',
  })

  broadcasts() {
    return this.crud(broadcasts)
  }

  async create(
    data: CreateBroadcastDto & { sendingDomainId?: string; audienceId: string },
    teamId: string,
  ) {
    const id = this.cuid()
    const emailContentId = this.cuid()

    await this.database.insert(emailContents).values({
      id: emailContentId,
    })

    await this.database.insert(broadcasts).values({
      ...data,
      teamId,
      id,
      emailContentId,
      createdAt: DateTime.now().toJSDate(),
    })

    return { id }
  }

  async update(id: string, { sendAt, ...payload }: Partial<UpdateSetBroadcastInput>) {
    await this.database
      .update(broadcasts)
      .set({
        ...payload,
        ...(sendAt ? { sendAt: new Date(sendAt as string) } : {}),
        updatedAt: DateTime.now().toJSDate(),
      })
      .where(eq(broadcasts.id, id))
    return { id }
  }

  async delete(id: string) {
    await this.database.delete(broadcasts).where(eq(broadcasts.id, id))

    return { id }
  }

  async findByIdWithAbTestVariants(id: string) {
    const broadcastEmailContents = alias(emailContents, 'broadcastEmailContents')
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
      .leftJoin(abTestVariants, eq(abTestVariants.broadcastId, broadcasts.id))
      .leftJoin(emailContents, eq(emailContents.id, abTestVariants.emailContentId))
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
    return this.findByIdWithAbTestVariants(id)
  }

  async findAllForTeam(teamId: string) {
    return this.database.query.broadcasts.findMany({
      with: {
        emailContent: true,
      },
      where: eq(broadcasts.teamId, teamId),
    })
  }

  async getTotalRecipients(broadcast: Broadcast) {
    const segmentQueryConditions: SQLWrapper[] = []

    if (broadcast.segmentId) {
      const segment = await container
        .make(SegmentRepository)
        .findById(broadcast.segmentId)
      const audience = await container
        .make(AudienceRepository)
        .findById(broadcast.audienceId)

      if (segment && audience) {
        segmentQueryConditions.push(
          new SegmentBuilder(segment.filterGroups, audience).build(),
        )
      }
    }

    const recipients = await this.database
      .select({ id: contacts.id })
      .from(contacts)
      .where(
        and(eq(contacts.audienceId, broadcast.audienceId), ...segmentQueryConditions),
      )

    return recipients
  }
}
