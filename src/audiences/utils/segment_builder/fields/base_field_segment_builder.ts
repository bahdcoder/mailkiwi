import { type SQLWrapper, and, eq, gte, like, lte, not } from "drizzle-orm"
import type { AnyMySqlColumn } from "drizzle-orm/mysql-core"

import type { CreateSegmentDto } from "@/audiences/dto/segments/create_segment_dto.js"

export class FieldSegmentBuilder {
  protected field: AnyMySqlColumn

  constructor(
    protected operation: CreateSegmentDto["filterGroups"]["groups"][number]["conditions"][number]["operation"],
    protected value: CreateSegmentDto["filterGroups"]["groups"][number]["conditions"][number]["value"],
  ) {}

  forField(field: AnyMySqlColumn) {
    this.field = field

    return this
  }

  buildCommonOperations() {
    const queryConditions: SQLWrapper[] = []

    switch (this.operation) {
      case "eq":
        queryConditions.push(this.buildEqualOperation())
        break
      case "startsWith":
        queryConditions.push(this.buildStartsWithOperation())
        break
      case "endsWith":
        queryConditions.push(this.buildEndsWithOperation())
        break
      case "gte":
        queryConditions.push(this.buildGteOperation())
        break
      case "lte":
        queryConditions.push(this.buildLteOperation())
        break
      case "contains":
        queryConditions.push(this.buildContainsOperation())
        break
      case "notContains":
        queryConditions.push(this.buildNotContainsOperation())
        break
      default:
        break
    }

    return queryConditions
  }

  buildEqualOperation() {
    return eq(this.field, this.value as string)
  }

  buildGteOperation() {
    return gte(this.field, this.value as string)
  }

  buildLteOperation() {
    return lte(this.field, this.value as string)
  }

  buildStartsWithOperation() {
    return like(this.field, `${this.value}%`)
  }

  buildEndsWithOperation() {
    return like(this.field, `%${this.value}`)
  }

  buildContainsOperation() {
    return like(this.field, `%${this.value}%`)
  }

  buildNotContainsOperation() {
    return not(like(this.field, `%${this.value}%`))
  }
}
