import { type SQLWrapper, and, eq, inArray, notInArray } from 'drizzle-orm'
import { FieldSegmentBuilder } from './base_field_segment_builder.js'

import type { CreateSegmentDto } from '#root/core/audiences/dto/segments/create_segment_dto.js'

import { contacts, tagsOnContacts } from '#root/database/schema.js'

import { E_OPERATION_FAILED } from '#root/core/http/responses/errors.js'

import { makeDatabase } from '#root/core/shared/container/index.js'

export class TagsSegmentBuilder extends FieldSegmentBuilder {
  constructor(
    protected operation: CreateSegmentDto['filterGroups']['groups'][number]['conditions'][number]['operation'],
    protected value: CreateSegmentDto['filterGroups']['groups'][number]['conditions'][number]['value'],
  ) {
    super(operation, value)
  }

  private queryTagsForContacts = () =>
    makeDatabase()
      .select({ id: tagsOnContacts.contactId })
      .from(tagsOnContacts)
      .where(
        and(
          inArray(tagsOnContacts.tagId, this.value as string[]),
          eq(tagsOnContacts.contactId, contacts.id),
        ),
      )

  build() {
    const queryConditions: SQLWrapper[] = []

    switch (this.operation) {
      case 'contains':
        queryConditions.push(inArray(contacts.id, this.queryTagsForContacts()))
        break
      case 'notContains':
        queryConditions.push(notInArray(contacts.id, this.queryTagsForContacts()))
        break
      default:
        throw E_OPERATION_FAILED(
          `Filter operation ${this.operation} not supported for field email.`,
        )
    }

    return queryConditions
  }
}
