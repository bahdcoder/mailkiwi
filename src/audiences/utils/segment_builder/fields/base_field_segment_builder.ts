import type { CreateSegmentDto } from "@/audiences/dto/segments/create_segment_dto.ts";
import { E_OPERATION_FAILED } from "@/http/responses/errors.ts";
import { contacts } from "@/database/schema/schema.ts";
import { and, eq, gte, like, lte, type SQLWrapper } from "drizzle-orm";
import { type AnyMySqlColumn } from "drizzle-orm/mysql-core";

export class FieldSegmentBuilder {
  protected field: AnyMySqlColumn;

  constructor(
    protected operation: CreateSegmentDto["conditions"][number]["operation"],
    protected value: CreateSegmentDto["conditions"][number]["value"],
  ) {}

  forField(field: AnyMySqlColumn) {
    this.field = field;

    return this;
  }

  buildCommonOperations() {
    const queryConditions: SQLWrapper[] = [];

    switch (this.operation) {
      case "eq":
        queryConditions.push(this.buildEqualOperation());
        break;
      case "startsWith":
        queryConditions.push(this.buildStartsWithOperation());
        break;
      case "endsWith":
        queryConditions.push(this.buildEndsWithOperation());
        break;
      case "gte":
        queryConditions.push(this.buildGteOperation());
        break;
      case "lte":
        queryConditions.push(this.buildLteOperation());
        break;
      default:
        break;
    }

    return queryConditions;
  }

  buildEqualOperation() {
    return eq(this.field, this.value as string);
  }

  buildGteOperation() {
    return gte(this.field, this.value as string);
  }

  buildLteOperation() {
    return lte(this.field, this.value as string);
  }

  buildStartsWithOperation() {
    return like(this.field, `${this.value}%`);
  }

  buildEndsWithOperation() {
    return like(this.field, `%${this.value}`);
  }
}
