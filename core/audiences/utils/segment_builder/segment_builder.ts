import { type SQL, type SQLWrapper, and, or } from 'drizzle-orm'
import { FieldSegmentBuilder } from './fields/base_field_segment_builder.js'
import { TagsSegmentBuilder } from './fields/tags_segment_builder.js'

import type { CreateSegmentDto } from '@/audiences/dto/segments/create_segment_dto.js'
import { ActivitySegmentBuilder } from '@/audiences/utils/segment_builder/fields/activity_segment_builder.js'
import { PropertiesSegmentBuilder } from '@/audiences/utils/segment_builder/fields/properties_segment_builder.js'

import type { Audience } from '@/database/database_schema_types.js'
import { contacts } from '@/database/schema.js'

export class SegmentBuilder {
  constructor(
    private groups: CreateSegmentDto['filterGroups'],
    private audience: Audience,
  ) {}

  protected buildConditions(
    conditions: CreateSegmentDto['filterGroups']['groups'][number]['conditions'],
  ): SQLWrapper[] {
    const queryConditions: SQLWrapper[] = []

    for (const condition of conditions) {
      if (condition.field.startsWith('properties.')) {
        queryConditions.push(
          ...new PropertiesSegmentBuilder(condition, this.audience).build(),
        )
        break
      }

      switch (condition.field) {
        case 'email':
        case 'firstName':
        case 'lastName':
        case 'lastTrackedActivityFrom':
        case 'lastTrackedActivityUsingBrowser':
        case 'lastTrackedActivityUsingDevice':
          queryConditions.push(
            ...new FieldSegmentBuilder(condition.operation, condition.value)
              .forField(contacts[condition.field])
              .buildCommonOperations(),
          )
          break
        case 'tags':
          queryConditions.push(
            ...new TagsSegmentBuilder(condition.operation, condition.value).build(),
          )
          break
        case 'subscribedAt':
          break
        case 'lastSentBroadcastEmailAt':
        case 'lastSentAutomationEmailAt':
        case 'lastOpenedBroadcastEmailAt':
        case 'lastOpenedAutomationEmailAt':
        case 'lastClickedBroadcastEmailLinkAt':
        case 'lastClickedAutomationEmailLinkAt':
          queryConditions.push(...new ActivitySegmentBuilder(condition).build())
          break
        default:
          break
      }
    }

    return queryConditions
  }

  build(): SQLWrapper {
    const queryConditions: SQLWrapper[] = []

    for (const group of this.groups.groups) {
      const sqlConditions = this.buildConditions(group.conditions)

      if (group.type === 'AND') {
        queryConditions.push(and(...sqlConditions) as SQL)
      }

      if (group.type === 'OR') {
        queryConditions.push(or(...sqlConditions) as SQL)
      }
    }

    if (this.groups.type === 'OR') {
      return or(...queryConditions) as SQL
    }

    return and(...queryConditions) as SQL
  }
}
