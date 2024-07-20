import { z } from "zod"

import { E_VALIDATION_FAILED } from "@/http/responses/errors.ts"
import { HonoContext } from "@/infrastructure/server/types.ts"

export class BaseController {
  // eslint-disable-next-line
  protected async validate<T extends z.ZodType<any>>(
    ctx: HonoContext,
    schema: T,
  ): Promise<z.infer<T>> {
    const { success, error, data } = await schema.safeParseAsync(
      await ctx.req.json(),
    )

    if (!success) throw E_VALIDATION_FAILED(error)

    return data
  }

  protected ensureTeam(ctx: HonoContext) {
    const team = ctx.get("team")

    if (!team)
      throw E_VALIDATION_FAILED({
        errors: [
          {
            message: "The team is required to create an audience.",
            path: ["email"],
          },
        ],
      })

    return team
  }
}
