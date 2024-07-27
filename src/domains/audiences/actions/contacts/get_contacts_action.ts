import { container } from '@/utils/typi.js'
import { SegmentRepository } from '@/domains/audiences/repositories/segment_repository.ts'
import type {
  Audience,
  Contact,
  Segment,
} from '@/infrastructure/database/schema/types.ts'
import { E_VALIDATION_FAILED } from '@/http/responses/errors.ts'
import { makeDatabase } from '@/infrastructure/container.ts'
import {
  contacts,
  tags,
  tagsOnContacts,
} from '@/infrastructure/database/schema/schema.ts'
import { AudienceRepository } from '@/domains/audiences/repositories/audience_repository.js'
import { SegmentBuilder } from '@/domains/audiences/utils/segment_builder/segment_builder.js'
import type { CreateSegmentDto } from '@/domains/audiences/dto/segments/create_segment_dto.js'
import { eq, inArray, sql, SQLWrapper } from 'drizzle-orm'
import { Paginator } from '@/domains/shared/utils/pagination/paginator.ts'
import { alias } from 'drizzle-orm/mysql-core'

export class GetContactsAction {
  constructor(
    private segmentRepository = container.make(SegmentRepository),
    private audienceRepository = container.make(AudienceRepository),
    private database = makeDatabase(),
  ) {}

  handle = async (
    audienceId?: string,
    segmentId?: string,
    page?: number,
    perPage?: number,
  ) => {
    let segment: Segment | undefined
    let audience: Audience | undefined

    if (!audienceId) {
      throw E_VALIDATION_FAILED([{ message: 'Audience id is required.' }])
    }

    const queryConditions: SQLWrapper[] = []

    if (audienceId) {
      audience = await this.audienceRepository.findById(audienceId)

      if (!audience) {
        throw E_VALIDATION_FAILED([
          { message: `Audience with id ${audienceId} not found.` },
        ])
      }
    }

    if (segmentId) {
      segment = await this.segmentRepository.findById(segmentId)

      if (!segment)
        throw E_VALIDATION_FAILED([
          { message: `Segment with id ${segmentId} not found.` },
        ])

      queryConditions.push(
        new SegmentBuilder(
          segment.conditions as CreateSegmentDto['conditions'],
        ).build(),
      )
    }

    return new Paginator(contacts)
      .queryConditions([...queryConditions])
      .transformRows<Contact>(async (rows) => {
        const tagsForContacts = await this.database
          .selectDistinct()
          .from(tagsOnContacts)
          .innerJoin(tags, eq(tagsOnContacts.tagId, tags.id))
          .where(
            inArray(
              tagsOnContacts.contactId,
              rows.map((row) => row.id),
            ),
          )

        return rows.map((row) => ({
          ...row,
          tags: tagsForContacts
            .filter((tag) => tag.tagsOnContacts?.contactId === row.id)
            .map((relation) => relation.tags),
        }))
      })
      .paginate(page, perPage)
  }
}
