import {
  type BaseSchema,
  type BaseSchemaAsync,
  type InferInput,
  safeParseAsync,
} from "valibot"

import type { HonoContext } from "@/server/types.js"

import { E_VALIDATION_FAILED } from "@/http/responses/errors.js"

export class BaseController {
  protected async validate<
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
    const team = ctx.get("team")

    if (!team)
      throw E_VALIDATION_FAILED([
        {
          message: "The team is required to create an audience.",
          field: "email",
        },
      ])

    return team
  }
}
