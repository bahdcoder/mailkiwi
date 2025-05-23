import { type SQLWrapper, and, eq, inArray } from 'drizzle-orm'

import type { SearchContactsDto } from '#root/core/audiences/dto/contacts/search_contacts_dto.js'
import { AudienceRepository } from '#root/core/audiences/repositories/audience_repository.js'
import { SegmentRepository } from '#root/core/audiences/repositories/segment_repository.js'
import { SegmentBuilder } from '#root/core/audiences/utils/segment_builder/segment_builder.js'

import type {
  Audience,
  Contact,
  ContactWithProperties,
  Segment,
} from '#root/database/database_schema_types.js'
import {
  ContactFilterGroup,
  contactProperties,
  contacts,
  tags,
  tagsOnContacts,
} from '#root/database/schema.js'

import { E_VALIDATION_FAILED } from '#root/core/http/responses/errors.js'

import { makeDatabase } from '#root/core/shared/container/index.js'
import { Paginator } from '#root/core/shared/utils/pagination/paginator.js'

import { container } from '#root/core/utils/typi.js'

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
    filters?: SearchContactsDto['filters'],
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
          {
            message: `Audience with id ${audienceId} not found.`,
          },
        ])
      }

      queryConditions.push(eq(contacts.audienceId, audience.id))
    }

    if (filters) {
      queryConditions.push(new SegmentBuilder(filters, audience as Audience).build())
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
        new SegmentBuilder(segment.filterGroups, audience as Audience).build(),
      )
    }

    const paginator = await new Paginator<Contact>(contacts)
      .queryConditions([...queryConditions])
      .size(perPage ?? 100)
      .page(page ?? 1)
      .transformRows(async (rows) => {
        const [tagsForContacts, allContactProperties] = await Promise.all([
          this.database
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
            ),
          this.database
            .select()
            .from(contactProperties)
            .where(
              and(
                inArray(
                  contactProperties.contactId,
                  rows.map((row) => row.id),
                ),
              ),
            ),
        ])

        return rows.map((row) => ({
          ...row,
          tags: tagsForContacts
            .filter((tag) => tag.tagsOnContacts?.contactId === row.id)
            .map((relation) => relation.tags),
          properties: allContactProperties.filter(
            (property) => property.contactId === row.id,
          ),
        }))
      })
      .paginate()

    const knownProperties = audience?.knownProperties

    const data = paginator.data as ContactWithProperties[]

    const knownPropertiesIdToTypeMap: Record<
      string,
      'boolean' | 'date' | 'text' | 'float'
    > = {}

    for (const property of knownProperties ?? []) {
      knownPropertiesIdToTypeMap[property.id] = property.type
    }

    return {
      ...paginator,
      data: data.map((contact) => {
        const parsedProperties: ContactWithProperties['parsedProperties'] = {}

        for (const property of contact.properties) {
          parsedProperties[property.name] =
            property[knownPropertiesIdToTypeMap[property.name]]
        }

        return {
          ...contact,
          parsedProperties,
        }
      }),
    }
  }
}
