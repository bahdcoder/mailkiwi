import { FieldSegmentBuilder } from "./base_field_segment_builder.js"
import { type SQLWrapper, and, eq, gte, like, lte } from "drizzle-orm"
import { AnyMySqlColumn } from "drizzle-orm/mysql-core"
import { DateTime } from "luxon"

import type { CreateSegmentDto } from "@/audiences/dto/segments/create_segment_dto.js"

import { contacts } from "@/database/schema.js"

import { E_OPERATION_FAILED } from "@/http/responses/errors.js"

export class ActivitySegmentBuilder {
  constructor(
    protected condition: CreateSegmentDto["filterGroups"]["groups"][number]["conditions"][number],
  ) {}

  forField(): AnyMySqlColumn {
    switch (this.condition.field) {
      case "lastClickedAutomationEmailLinkAt":
        return contacts.lastClickedAutomationEmailLinkAt
      case "lastClickedBroadcastEmailLinkAt":
        return contacts.lastClickedBroadcastEmailLinkAt
      case "lastOpenedAutomationEmailAt":
        return contacts.lastOpenedAutomationEmailAt
      case "lastOpenedBroadcastEmailAt":
        return contacts.lastOpenedBroadcastEmailAt
      case "lastSentAutomationEmailAt":
        return contacts.lastSentAutomationEmailAt
      case "lastSentBroadcastEmailAt":
        return contacts.lastSentBroadcastEmailAt
    }

    return contacts.lastClickedAutomationEmailLinkAt
  }

  timeWindowToDate() {
    const [, time] = (this.condition.value as string).split("_")

    return DateTime.now()
      .minus({ days: parseInt(time) })
      .toJSDate()
  }

  build() {
    switch (this.condition.operation) {
      case "in_time_window":
        return [
          and(
            gte(this.forField(), this.timeWindowToDate()),
            lte(this.forField(), DateTime.now().toJSDate()),
          ),
        ] as SQLWrapper[]

      default:
        throw E_OPERATION_FAILED(
          `Filter operation ${this.condition.operation} not supported for field email.`,
        )
    }
  }
}
