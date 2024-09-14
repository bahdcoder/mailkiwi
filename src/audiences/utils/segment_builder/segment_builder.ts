import { FieldSegmentBuilder } from "./fields/base_field_segment_builder.ts"
import { TagsSegmentBuilder } from "./fields/tags_segment_builder.ts"
import { type SQL, type SQLWrapper, and, or } from "drizzle-orm"

import type { CreateSegmentDto } from "@/audiences/dto/segments/create_segment_dto.ts"

import { contacts } from "@/database/schema/schema.ts"

export class SegmentBuilder {
  constructor(private groups: CreateSegmentDto["filterGroups"]) {}

  protected buildConditions(
    conditions: CreateSegmentDto["filterGroups"]["groups"][number]["conditions"],
  ): SQLWrapper[] {
    const queryConditions: SQLWrapper[] = []

    for (const condition of conditions) {
      switch (condition.field) {
        case "email":
        case "firstName":
        case "lastName":
          queryConditions.push(
            ...new FieldSegmentBuilder(
              condition.operation,
              condition.value,
            )
              .forField(contacts[condition.field])
              .buildCommonOperations(),
          )
          break
        case "tags":
          queryConditions.push(
            ...new TagsSegmentBuilder(
              condition.operation,
              condition.value,
            ).build(),
          )
          break
        case "subscribedAt":
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

      if (group.type === "AND") {
        queryConditions.push(and(...sqlConditions) as SQL)
      }

      if (group.type === "OR") {
        queryConditions.push(or(...sqlConditions) as SQL)
      }
    }

    // d({ queryConditions })

    if (this.groups.type === "OR") {
      return or(...queryConditions) as SQL
    }

    return and(...queryConditions) as SQL
  }
}
