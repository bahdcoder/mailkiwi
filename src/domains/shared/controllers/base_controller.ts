import { FastifyRequest } from "fastify"
import { injectable } from "tsyringe"
import { z } from "zod"

import { E_VALIDATION_FAILED } from "@/http/responses/errors.ts"

@injectable()
export class BaseController {
  // eslint-disable-next-line
  protected validate<T extends z.ZodObject<any>>(
    request: FastifyRequest,
    schema: T,
  ): z.infer<T> {
    const { success, error, data } = schema.safeParse(request.body)

    if (!success) throw E_VALIDATION_FAILED(error)

    return data
  }

  protected ensureTeam(request: FastifyRequest) {
    if (!request.team)
      throw E_VALIDATION_FAILED({
        errors: [
          {
            message: "The team is required to create an audience.",
            path: ["email"],
          },
        ],
      })

    return this
  }
}
