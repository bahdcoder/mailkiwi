import { makeDatabase } from '@/infrastructure/container.ts'
import { and, count, SelectedFields, type SQLWrapper } from 'drizzle-orm'
import type {
  AnyMySqlColumn,
  AnyMySqlTable,
  MySqlSelect,
  MySqlSelectBuilder,
} from 'drizzle-orm/mysql-core'

type QueryModifierFn = (
  query: MySqlSelect<any, any, any>,
) => MySqlSelect<any, any, any>

type SelectFields = SelectedFields<AnyMySqlColumn, AnyMySqlTable>

type RowTransformer<T = any> = (row: T[]) => Promise<T[]> | T[]

export class Paginator {
  //   public static paginate<T>(items: T[], page: number, perPage: number): T[] {
  //     const offset = (page - 1) * perPage
  //     return items.slice(offset, offset + perPage)
  //   }
  private conditions: SQLWrapper[] = []
  private $selectColumns: SelectFields
  private $modifyQuery: QueryModifierFn = (query) => query
  private $modifyWhereQuery: QueryModifierFn = (query) => query
  private $transformRows: RowTransformer = (rows) => rows

  constructor(
    private table: AnyMySqlTable,
    private database = makeDatabase(),
  ) {}

  queryConditions(conditions: SQLWrapper[]) {
    this.conditions = conditions

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

  transformRows<T>(transformer: RowTransformer<T>) {
    this.$transformRows = transformer

    return this
  }

  async paginate(page = 1, perPage = 10) {
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
      .limit(perPage)
      .offset((page - 1) * perPage)

    const [countResult, selectResult] = await Promise.all([
      countQuery.execute(),
      selectQuery.execute(),
    ])

    return {
      perPage,
      page,
      data: await this.$transformRows(selectResult),
      total: countResult[0].count,
    }
  }
}

// new Paginator()
// new Paginator(drizzleModel).orderBy().paginate(1, 10)
