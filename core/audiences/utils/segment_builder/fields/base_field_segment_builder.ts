import { type SQLWrapper, and, eq, gte, like, lte, not } from 'drizzle-orm'
import type { AnyMySqlColumn } from 'drizzle-orm/mysql-core'

import type { CreateSegmentDto } from '#root/core/audiences/dto/segments/create_segment_dto.js'

/**
 * FieldSegmentBuilder is the base class for building SQL conditions for contact field filtering.
 *
 * This class provides the foundation for Kibamail's segmentation system, implementing
 * common comparison operations that can be applied to database fields. It supports
 * operations like equality, comparison, and pattern matching, which are essential for
 * creating targeted audience segments.
 *
 * The builder uses a fluent interface pattern, allowing for readable and chainable
 * method calls. It's designed to be extended by specialized builders for different
 * field types, while providing a consistent interface for building SQL conditions.
 *
 * This class powers many of Kibamail's core segmentation features, enabling users to
 * create segments based on contact properties like:
 * - Email domain filtering (e.g., all Gmail users)
 * - Name-based targeting (e.g., contacts whose names start with 'A')
 * - Geographic targeting (e.g., contacts from specific regions)
 */
export class FieldSegmentBuilder {
  protected field: AnyMySqlColumn

  /**
   * Creates a new field segment builder.
   *
   * @param operation - The comparison operation to apply (eq, startsWith, contains, etc.)
   * @param value - The value to compare against
   */
  constructor(
    protected operation: CreateSegmentDto['filterGroups']['groups'][number]['conditions'][number]['operation'],
    protected value: CreateSegmentDto['filterGroups']['groups'][number]['conditions'][number]['value'],
  ) {}

  /**
   * Specifies the database field to apply the condition to.
   *
   * This method sets the target field for the condition and returns the builder
   * instance, allowing for method chaining. This fluent interface makes the
   * code more readable and maintainable.
   *
   * @param field - The database column to filter on
   * @returns The builder instance for method chaining
   */
  forField(field: AnyMySqlColumn) {
    this.field = field

    return this
  }

  /**
   * Builds SQL conditions based on the specified operation.
   *
   * This method is the core of the segment builder, translating the abstract
   * operation and value into concrete SQL conditions. It supports a variety of
   * operations that can be applied to database fields:
   *
   * - eq: Exact equality matching
   * - startsWith: Prefix matching using LIKE
   * - endsWith: Suffix matching using LIKE
   * - gte: Greater than or equal comparison
   * - lte: Less than or equal comparison
   * - contains: Substring matching using LIKE
   * - notContains: Negative substring matching
   *
   * The method delegates to specialized methods for each operation type,
   * making it easy to extend with new operations in the future.
   *
   * @returns Array of SQL conditions based on the operation
   */
  buildCommonOperations() {
    const queryConditions: SQLWrapper[] = []

    switch (this.operation) {
      case 'eq':
        queryConditions.push(this.buildEqualOperation())
        break
      case 'startsWith':
        queryConditions.push(this.buildStartsWithOperation())
        break
      case 'endsWith':
        queryConditions.push(this.buildEndsWithOperation())
        break
      case 'gte':
        queryConditions.push(this.buildGteOperation())
        break
      case 'lte':
        queryConditions.push(this.buildLteOperation())
        break
      case 'contains':
        queryConditions.push(this.buildContainsOperation())
        break
      case 'notContains':
        queryConditions.push(this.buildNotContainsOperation())
        break
      default:
        break
    }

    return queryConditions
  }

  /**
   * Builds an equality condition (field = value).
   * @returns SQL condition for exact matching
   */
  buildEqualOperation() {
    return eq(this.field, this.value as string)
  }

  /**
   * Builds a greater than or equal condition (field >= value).
   * @returns SQL condition for greater than or equal comparison
   */
  buildGteOperation() {
    return gte(this.field, this.value as string)
  }

  /**
   * Builds a less than or equal condition (field <= value).
   * @returns SQL condition for less than or equal comparison
   */
  buildLteOperation() {
    return lte(this.field, this.value as string)
  }

  /**
   * Builds a prefix matching condition (field LIKE 'value%').
   * @returns SQL condition for prefix matching
   */
  buildStartsWithOperation() {
    return like(this.field, `${this.value}%`)
  }

  /**
   * Builds a suffix matching condition (field LIKE '%value').
   * @returns SQL condition for suffix matching
   */
  buildEndsWithOperation() {
    return like(this.field, `%${this.value}`)
  }

  /**
   * Builds a substring matching condition (field LIKE '%value%').
   * @returns SQL condition for substring matching
   */
  buildContainsOperation() {
    return like(this.field, `%${this.value}%`)
  }

  /**
   * Builds a negative substring matching condition (field NOT LIKE '%value%').
   * @returns SQL condition for negative substring matching
   */
  buildNotContainsOperation() {
    return not(like(this.field, `%${this.value}%`))
  }
}
