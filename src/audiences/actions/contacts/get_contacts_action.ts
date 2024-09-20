import { type SQLWrapper, and, eq, inArray } from "drizzle-orm"

import { AudienceRepository } from "@/audiences/repositories/audience_repository.js"
import { SegmentRepository } from "@/audiences/repositories/segment_repository.js"
import { SegmentBuilder } from "@/audiences/utils/segment_builder/segment_builder.js"

import type {
  Audience,
  Contact,
  Segment,
} from "@/database/schema/database_schema_types.js"
import {
  contacts,
  tags,
  tagsOnContacts,
} from "@/database/schema/schema.js"

import { E_VALIDATION_FAILED } from "@/http/responses/errors.js"

import { makeDatabase } from "@/shared/container/index.js"
import { Paginator } from "@/shared/utils/pagination/paginator.js"

import { container } from "@/utils/typi.js"

export class GetContactsAction {
  constructor(
    private segmentRepository = container.make(SegmentRepository),
    private audienceRepository = container.make(AudienceRepository),
    private database = makeDatabase(),
  ) {}

  handle = async (
    audienceId?: number,
    segmentId?: number,
    page?: number,
    perPage?: number,
  ) => {
    let segment: Segment | undefined
    let audience: Audience | undefined

    if (!audienceId) {
      throw E_VALIDATION_FAILED([{ message: "Audience id is required." }])
    }

    const queryConditions: SQLWrapper[] = []

    if (audienceId) {
      audience = await this.audienceRepository.findById(audienceId)

      if (!audience) {
        throw E_VALIDATION_FAILED([
          {
            message: `Audience with id ${audienceId} not found.`,
          },
        ])
      }

      queryConditions.push(eq(contacts.audienceId, audience.id))
    }

    if (segmentId) {
      segment = await this.segmentRepository.findById(segmentId)

      if (!segment)
        throw E_VALIDATION_FAILED([
          {
            message: `Segment with id ${segmentId} not found.`,
          },
        ])

      queryConditions.push(
        new SegmentBuilder(segment.filterGroups).build(),
      )
    }

    return new Paginator<Contact>(contacts)
      .queryConditions([...queryConditions])
      .size(perPage ?? 10)
      .page(page ?? 1)
      .transformRows(async (rows) => {
        const tagsForContacts = await this.database
          .selectDistinct()
          .from(tagsOnContacts)
          .innerJoin(tags, eq(tagsOnContacts.tagId, tags.id))
          .where(
            and(
              inArray(
                tagsOnContacts.contactId,
                rows.map((row) => row.id),
              ),
            ),
          )

        return rows.map((row) => ({
          ...row,
          tags: tagsForContacts
            .filter((tag) => tag.tagsOnContacts?.contactId === row.id)
            .map((relation) => relation.tags),
        }))
      })
      .paginate()
  }
}
