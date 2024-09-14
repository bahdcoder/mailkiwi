import { FieldSegmentBuilder } from "./base_field_segment_builder.ts"
import { type SQLWrapper, and, eq, like } from "drizzle-orm"

import type { CreateSegmentDto } from "@/audiences/dto/segments/create_segment_dto.ts"

import { contacts } from "@/database/schema/schema.ts"

import { E_OPERATION_FAILED } from "@/http/responses/errors.ts"

export class SubscribedAtSegmentBuilder extends FieldSegmentBuilder {
  constructor(
    protected operation: CreateSegmentDto["filterGroups"]["groups"][number]["conditions"][number]["operation"],
    protected value: CreateSegmentDto["filterGroups"]["groups"][number]["conditions"][number]["value"],
  ) {
    super(operation, value)

    this.forField(contacts.subscribedAt)
  }

  build() {
    const queryConditions: SQLWrapper[] = this.buildCommonOperations()

    switch (this.operation) {
      default:
        throw E_OPERATION_FAILED(
          `Filter operation ${this.operation} not supported for field email.`,
        )
    }

    // return queryConditions
  }
}
