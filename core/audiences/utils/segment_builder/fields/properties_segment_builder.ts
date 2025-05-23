import { and, eq, gte, inArray } from 'drizzle-orm'

import type { CreateSegmentDto } from '#root/core/audiences/dto/segments/create_segment_dto.js'

import type { Audience } from '#root/database/database_schema_types.js'
import {
  type KnownAudienceProperty,
  contactProperties,
  contacts,
} from '#root/database/schema.js'

import { makeDatabase } from '#root/core/shared/container/index.js'

export class PropertiesSegmentBuilder {
  constructor(
    protected condition: CreateSegmentDto['filterGroups']['groups'][number]['conditions'][number],
    protected audience: Audience,
  ) {}

  getColumnFromPropertyType(type: KnownAudienceProperty['type']) {
    if (type === 'boolean') {
      return contactProperties.boolean
    }

    if (type === 'date') {
      return contactProperties.date
    }

    if (type === 'float') {
      return contactProperties.float
    }

    return contactProperties.text
  }

  private queryContactProperties = () => {
    const [, name] = this.condition.field?.split('properties.') || []

    const property = this.audience.knownProperties?.find(
      (property) => property.id === name,
    )

    return makeDatabase()
      .select({ id: contactProperties.contactId })
      .from(contactProperties)
      .where(
        and(
          eq(contactProperties.audienceId, this.audience.id),
          eq(contactProperties.contactId, contacts.id),
          eq(contactProperties.name, name),
          gte(
            this.getColumnFromPropertyType(property?.type ?? 'text'),
            this.condition.value as string,
          ),
        ),
      )
  }

  build() {
    return [inArray(contacts.id, this.queryContactProperties())]
  }
}
