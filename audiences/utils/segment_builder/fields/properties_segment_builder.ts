import { FieldSegmentBuilder } from "./base_field_segment_builder.js"
import {
  type SQLWrapper,
  and,
  eq,
  gte,
  inArray,
  like,
  lte,
} from "drizzle-orm"
import { AnyMySqlColumn } from "drizzle-orm/mysql-core"
import { DateTime } from "luxon"

import type { CreateSegmentDto } from "@/audiences/dto/segments/create_segment_dto.js"

import { Audience } from "@/database/database_schema_types.js"
import {
  KnownAudienceProperty,
  contactProperties,
  contacts,
} from "@/database/schema.js"

import { E_OPERATION_FAILED } from "@/http/responses/errors.js"

import { makeDatabase } from "@/shared/container/index.js"

export class PropertiesSegmentBuilder {
  constructor(
    protected condition: CreateSegmentDto["filterGroups"]["groups"][number]["conditions"][number],
    protected audience: Audience,
  ) {}

  getColumnFromPropertyType(type: KnownAudienceProperty["type"]) {
    if (type === "boolean") {
      return contactProperties.boolean
    }

    if (type === "date") {
      return contactProperties.date
    }

    if (type === "float") {
      return contactProperties.float
    }

    return contactProperties.text
  }

  private queryContactProperties = () => {
    const [, name] = this.condition.field?.split("properties.")

    const property = this.audience.knownProperties?.find(
      (property) => property.name === name,
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
            this.getColumnFromPropertyType(property?.type ?? "text"),
            this.condition.value as any,
          ),
        ),
      )
  }

  build() {
    return [inArray(contacts.id, this.queryContactProperties())]
  }
}
