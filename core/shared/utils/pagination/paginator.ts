import {
  type SQL,
  type SQLWrapper,
  type SelectedFields,
  and,
  count,
  gt,
} from 'drizzle-orm'
import type { AnyMySqlColumn, AnyMySqlTable, MySqlSelect } from 'drizzle-orm/mysql-core'

import { E_OPERATION_FAILED } from '#root/core/http/responses/errors.js'

import { makeDatabase } from '#root/core/shared/container/index.js'

export type QueryModifierFn = (
  // biome-ignore lint/suspicious/noExplicitAny: MySQL query types require any
  query: MySqlSelect<any, any, any>,
  // biome-ignore lint/suspicious/noExplicitAny: MySQL query types require any
) => MySqlSelect<any, any, any>

type CursorControls = {
  previous: string | undefined
  next: string | undefined
}
export type CursorResultsModifierFn = (
  // biome-ignore lint/suspicious/noExplicitAny: Generic row type
  rows: any[],
  originalCursorResults: CursorControls,
) => CursorControls

type SelectFields = SelectedFields<AnyMySqlColumn, AnyMySqlTable>

// biome-ignore lint/suspicious/noExplicitAny: Generic transformer type
type RowTransformer<T = any> = (row: T[]) => Promise<T[]> | T[]

// biome-ignore lint/suspicious/noExplicitAny: Generic paginator class
export class Paginator<RowType extends object = any> {
  private conditions: (SQLWrapper | undefined)[] = []
  private $selectColumns: SelectFields

  private cursorPagination: {
    size: number
    cursor: string | undefined
    field: AnyMySqlColumn | undefined
  } = { size: 10, field: undefined, cursor: undefined }

  private offsetPagination: { size: number; page: number } = {
    size: 10,
    page: 1,
  }

  private $modifyQuery: QueryModifierFn = (query) => query
  private $modifyWhereQuery: QueryModifierFn = (query) => query
  private $transformRows: RowTransformer = (rows) => rows
  private $queryOrder: SQL
  private $cursorCondition: SQLWrapper | undefined
  private $modifyCursorResults: CursorResultsModifierFn

  constructor(
    private table: AnyMySqlTable,
    private database = makeDatabase(),
  ) {}

  queryConditions(conditions: (SQLWrapper | undefined)[]) {
    this.conditions = conditions.filter((condition) => condition !== undefined)

    return this
  }

  select(fields: SelectedFields<AnyMySqlColumn, AnyMySqlTable>) {
    this.$selectColumns = fields

    return this
  }

  modifyQuery(fn: QueryModifierFn) {
    this.$modifyQuery = fn

    return this
  }

  modifyQueryOrder(order: SQL) {
    this.$queryOrder = order

    return this
  }

  modifyCursorCondition(condition: SQLWrapper | undefined) {
    this.$cursorCondition = condition

    return this
  }

  modifyWhereQuery(fn: QueryModifierFn) {
    this.$modifyWhereQuery = fn

    return this
  }

  modifyCursorResults(fn: CursorResultsModifierFn) {
    this.$modifyCursorResults = fn
    return this
  }

  transformRows(transformer: RowTransformer<RowType>) {
    this.$transformRows = transformer

    return this
  }

  field(field: AnyMySqlColumn) {
    this.cursorPagination.field = field

    return this
  }

  size(size: number) {
    this.cursorPagination.size = size
    this.offsetPagination.size = size

    return this
  }

  page(page: number) {
    this.offsetPagination.page = page

    return this
  }

  cursor(cursor: string | undefined) {
    this.cursorPagination.cursor = cursor

    return this
  }

  cursorPaginate = this.next

  async next(): Promise<{
    data: RowType[]
    finished: boolean
    next: string | undefined
    previous: string | undefined
  }> {
    const selectSelect = this.$modifyQuery(
      this.database.selectDistinct(this.$selectColumns).from(this.table).$dynamic(),
    )

    if (!this.cursorPagination.field)
      throw E_OPERATION_FAILED('Field is required for cursor pagination')

    const cursorCondition = this.$cursorCondition
      ? this.$cursorCondition
      : gt(this.cursorPagination.field, this.cursorPagination.cursor)

    const selectQuery = this.$modifyWhereQuery(
      selectSelect.where(
        and(
          ...this.conditions,
          this.cursorPagination.cursor ? cursorCondition : undefined,
        ),
      ),
    )
      .limit(this.cursorPagination.size + 1)
      .orderBy(this.$queryOrder ? this.$queryOrder : this.cursorPagination.field)
      .$dynamic()

    const result = await selectQuery.execute()

    const finished = result.length <= this.cursorPagination.size

    const cursorResults = {
      next: result[this.cursorPagination.size - 1]?.[this.cursorPagination.field.name],
      previous: result[0]?.[this.cursorPagination.field.name],
    }

    return {
      ...(this.$modifyCursorResults
        ? this.$modifyCursorResults(result, cursorResults)
        : cursorResults),
      // cursor: this.cursorPagination.cursor as string,
      finished,
      data: await this.$transformRows(finished ? result : result.slice(0, -1)),
    }
  }

  async paginate(): Promise<{
    data: RowType[]
    total: number
    page: number
    perPage: number
  }> {
    const countSelect = this.$modifyQuery(
      this.database.select({ count: count() }).from(this.table).$dynamic(),
    )

    const countQuery = this.$modifyWhereQuery(countSelect.where(and(...this.conditions)))

    const selectSelect = this.$modifyQuery(
      this.database.selectDistinct(this.$selectColumns).from(this.table).$dynamic(),
    )

    const selectQuery = this.$modifyWhereQuery(
      selectSelect.where(and(...this.conditions)),
    )
      .limit(this.offsetPagination.size)
      .offset((this.offsetPagination.page - 1) * this.offsetPagination.size)

    const [countResult, selectResult] = await Promise.all([
      countQuery.execute(),
      selectQuery.execute(),
    ])

    const results = await this.$transformRows(selectResult)

    return {
      data: results,
      total: countResult[0].count,
      page: this.offsetPagination.page,
      perPage: this.offsetPagination.size,
    }
  }
}
