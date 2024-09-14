import { FieldSegmentBuilder } from "./base_field_segment_builder.ts"
import { type SQLWrapper, and, eq, inArray, notInArray } from "drizzle-orm"

import type { CreateSegmentDto } from "@/audiences/dto/segments/create_segment_dto.ts"

import { contacts, tagsOnContacts } from "@/database/schema/schema.ts"

import { E_OPERATION_FAILED } from "@/http/responses/errors.ts"

import { makeDatabase } from "@/shared/container/index.js"

export class TagsSegmentBuilder extends FieldSegmentBuilder {
  constructor(
    protected operation: CreateSegmentDto["filterGroups"]["groups"][number]["conditions"][number]["operation"],
    protected value: CreateSegmentDto["filterGroups"]["groups"][number]["conditions"][number]["value"],
  ) {
    super(operation, value)
  }

  private queryTagsForContacts = () =>
    makeDatabase()
      .select({ id: tagsOnContacts.contactId })
      .from(tagsOnContacts)
      .where(
        and(
          inArray(tagsOnContacts.tagId, this.value as number[]),
          eq(tagsOnContacts.contactId, contacts.id),
        ),
      )

  build() {
    const queryConditions: SQLWrapper[] = []

    switch (this.operation) {
      case "contains":
        queryConditions.push(
          inArray(contacts.id, this.queryTagsForContacts()),
        )
        break
      case "notContains":
        queryConditions.push(
          notInArray(contacts.id, this.queryTagsForContacts()),
        )
        break
      default:
        throw E_OPERATION_FAILED(
          `Filter operation ${this.operation} not supported for field email.`,
        )
    }

    return queryConditions
  }
}
