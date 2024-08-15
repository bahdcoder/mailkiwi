import type { CreateSegmentDto } from '@/audiences/dto/segments/create_segment_dto.ts'
import { E_OPERATION_FAILED } from '@/http/responses/errors.ts'
import { contacts } from '@/database/schema/schema.ts'
import { and, eq, like, type SQLWrapper } from 'drizzle-orm'
import { FieldSegmentBuilder } from './base_field_segment_builder.ts'

export class SubscribedAtSegmentBuilder extends FieldSegmentBuilder {
  constructor(
    protected operation: CreateSegmentDto['conditions'][number]['operation'],
    protected value: CreateSegmentDto['conditions'][number]['value'],
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
