import { E_OPERATION_FAILED } from '@/http/responses/errors.ts'
import { makeDatabase } from '@/shared/container/index.js'
import {
  and,
  count,
  gt,
  type SelectedFields,
  type SQLWrapper,
} from 'drizzle-orm'
import type {
  AnyMySqlColumn,
  AnyMySqlTable,
  MySqlSelect,
} from 'drizzle-orm/mysql-core'

type QueryModifierFn = (
  query: MySqlSelect<any, any, any>,
) => MySqlSelect<any, any, any>

type SelectFields = SelectedFields<AnyMySqlColumn, AnyMySqlTable>

type RowTransformer<T = any> = (row: T[]) => Promise<T[]> | T[]

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

  modifyWhereQuery(fn: QueryModifierFn) {
    this.$modifyWhereQuery = fn

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

  async next(): Promise<{
    data: RowType[]
    next: string | undefined
    finished: boolean
  }> {
    const selectSelect = this.$modifyQuery(
      this.database
        .selectDistinct(this.$selectColumns)
        .from(this.table)
        .$dynamic(),
    )

    if (!this.cursorPagination.field)
      throw E_OPERATION_FAILED('Field is required for cursor pagination')

    const selectQuery = this.$modifyWhereQuery(
      selectSelect.where(
        and(
          ...this.conditions,
          this.cursorPagination.cursor
            ? gt(this.cursorPagination.field, this.cursorPagination.cursor)
            : undefined,
        ),
      ),
    )
      .limit(this.cursorPagination.size + 1)
      .orderBy(this.cursorPagination.field)
      .$dynamic()

    const result = await selectQuery.execute()

    const finished = result.length <= this.cursorPagination.size

    return {
      next: result[this.cursorPagination.size - 1]?.[
        this.cursorPagination.field.name
      ],
      finished,
      data: await this.$transformRows(finished ? result : result.slice(0, -1)),
    }
  }

  async paginate(): Promise<{ data: RowType[]; total: number }> {
    const countSelect = this.$modifyQuery(
      this.database.select({ count: count() }).from(this.table).$dynamic(),
    )

    const countQuery = this.$modifyWhereQuery(
      countSelect.where(and(...this.conditions)),
    )

    const selectSelect = this.$modifyQuery(
      this.database
        .selectDistinct(this.$selectColumns)
        .from(this.table)
        .$dynamic(),
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

    return {
      data: await this.$transformRows(selectResult),
      total: countResult[0].count,
    }
  }
}

// new Paginator()
// new Paginator(drizzleModel).orderBy().paginate(1, 10)
