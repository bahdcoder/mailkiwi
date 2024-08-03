import type { CreateSegmentDto } from "@/audiences/dto/segments/create_segment_dto.ts";
import { E_OPERATION_FAILED } from "@/http/responses/errors.ts";
import { contacts, tagsOnContacts } from "@/database/schema/schema.ts";
import { and, eq, inArray, notInArray, type SQLWrapper } from "drizzle-orm";
import { FieldSegmentBuilder } from "./base_field_segment_builder.ts";
import { makeDatabase } from "@/shared/container/index.js";

export class TagsSegmentBuilder extends FieldSegmentBuilder {
  constructor(
    protected operation: CreateSegmentDto["conditions"][number]["operation"],
    protected value: CreateSegmentDto["conditions"][number]["value"],
  ) {
    super(operation, value);
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
      );

  build() {
    const queryConditions: SQLWrapper[] = [];

    switch (this.operation) {
      case "contains":
        queryConditions.push(inArray(contacts.id, this.queryTagsForContacts()));
        break;
      case "notContains":
        queryConditions.push(
          notInArray(contacts.id, this.queryTagsForContacts()),
        );
        break;
      default:
        throw E_OPERATION_FAILED(
          `Filter operation ${this.operation} not supported for field email.`,
        );
    }

    return queryConditions;
  }
}
