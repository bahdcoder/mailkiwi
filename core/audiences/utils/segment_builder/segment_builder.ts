import { type SQL, type SQLWrapper, and, or } from 'drizzle-orm'
import { FieldSegmentBuilder } from './fields/base_field_segment_builder.js'
import { TagsSegmentBuilder } from './fields/tags_segment_builder.js'

import type { CreateSegmentDto } from '#root/core/audiences/dto/segments/create_segment_dto.js'
import { ActivitySegmentBuilder } from '#root/core/audiences/utils/segment_builder/fields/activity_segment_builder.js'
import { PropertiesSegmentBuilder } from '#root/core/audiences/utils/segment_builder/fields/properties_segment_builder.js'

import type { Audience } from '#root/database/database_schema_types.js'
import { contacts } from '#root/database/schema.js'

/**
 * SegmentBuilder is a sophisticated query builder for creating complex audience segments.
 *
 * This class is the foundation of Kibamail's audience segmentation system, allowing users to create
 * highly targeted segments based on contact properties, behaviors, and engagement metrics. It translates
 * a declarative segment definition into SQL query conditions that can be used to filter contacts.
 *
 * The builder supports complex nested conditions with AND/OR logic, enabling powerful use cases like:
 * - Re-engagement campaigns targeting contacts who haven't opened emails in 30 days
 * - Geographic targeting based on contact location data
 * - Device-specific campaigns targeting users of particular browsers or devices
 * - Behavioral targeting based on previous email engagement patterns
 *
 * This system powers both manual segmentation for broadcasts and automated segmentation for
 * workflow automation triggers and conditions.
 */
export class SegmentBuilder {
  constructor(
    private groups: CreateSegmentDto['filterGroups'],
    private audience: Audience,
  ) {}

  /**
   * Builds SQL conditions for a group of segment conditions.
   *
   * This method processes each condition in a condition group and converts it to the appropriate
   * SQL query fragment based on the field type. It handles various field types including:
   *
   * - Basic contact fields (email, name, etc.)
   * - Custom contact properties (stored as JSON)
   * - Tags (many-to-many relationship)
   * - Activity timestamps (engagement metrics)
   * - Location and device information
   *
   * The method delegates to specialized builders for each field type, allowing for extensibility
   * as new field types are added to the system.
   *
   * @param conditions - Array of condition objects from a segment definition
   * @returns Array of SQL query fragments that can be combined with AND/OR operators
   */
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

  /**
   * Builds the complete SQL condition for the entire segment definition.
   *
   * This method processes the entire segment definition structure, which consists of:
   * 1. Multiple condition groups, each containing multiple conditions
   * 2. Logical operators (AND/OR) defining how groups and conditions combine
   *
   * The method first processes each condition group, combining the conditions within each group
   * according to the group's logical operator (AND/OR). Then it combines all the groups according
   * to the top-level logical operator.
   *
   * This nested structure allows for extremely flexible and powerful segmentation rules, such as:
   * "(Opened an email in the last 30 days AND is in the US) OR (Clicked a link in the last 7 days)"
   *
   * @returns A complete SQL condition that can be used in a WHERE clause to filter contacts
   */
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
