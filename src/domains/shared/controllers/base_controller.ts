import {
  type BaseSchema,
  type BaseSchemaAsync,
  type InferInput,
  safeParseAsync,
} from 'valibot'

import { E_VALIDATION_FAILED } from '@/http/responses/errors.js'
import type { HonoContext } from '@/infrastructure/server/types.js'

export class BaseController {
  protected async validate<
    /* eslint-disable-next-line */
    T extends BaseSchema<any, any, any> | BaseSchemaAsync<any, any, any>,
  >(ctx: HonoContext, schema: T): Promise<InferInput<T>> {
    const { success, issues, output } = await safeParseAsync(
      schema,
      await ctx.req.json(),
    )

    if (!success) throw E_VALIDATION_FAILED(issues)

    return output
  }

  protected ensureTeam(ctx: HonoContext) {
    const team = ctx.get('team')

    if (!team)
      throw E_VALIDATION_FAILED([
        {
          message: 'The team is required to create an audience.',
          field: 'email',
        },
      ])

    return team
  }
}
