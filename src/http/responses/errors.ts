import * as Boom from "@hapi/boom"
import { ZodError } from "zod"

export function E_UNAUTHORIZED(message = "Unauthorized."): never {
  throw Boom.unauthorized(message)
}

export function E_VALIDATION_FAILED(
  error: ZodError | { errors: { message: string; path: string[] }[] },
  message?: string,
): never {
  throw Boom.badRequest(message, {
    errors: error?.errors?.map((error) => ({
      message: error.message,
      field: error.path?.[0],
    })),
  })
}
