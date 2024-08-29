import { FieldSegmentBuilder } from "./fields/base_field_segment_builder.ts"
import { TagsSegmentBuilder } from "./fields/tags_segment_builder.ts"
import { type SQL, type SQLWrapper, and } from "drizzle-orm"

import type { CreateSegmentDto } from "@/audiences/dto/segments/create_segment_dto.ts"

import { contacts } from "@/database/schema/schema.ts"

export class SegmentBuilder {
  constructor(private conditions: CreateSegmentDto["conditions"]) {}

  build(): SQLWrapper {
    const queryConditions: SQLWrapper[] = []

    for (const condition of this.conditions) {
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

    return and(...queryConditions) as SQL
  }
}
