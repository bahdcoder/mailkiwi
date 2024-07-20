import { HTTPException } from "hono/http-exception"
import { StatusCode } from "hono/utils/http-status"
import { ZodError } from "zod"

export class E_REQUEST_EXCEPTION extends Error {
  constructor(
    public message: string,
    public payload?: object,
    public statusCode: StatusCode = 500,
  ) {
    super(message ?? "An error occurred.")
  }

  public static E_VALIDATION_FAILED(
    errors: ZodError | { errors: { message: string; path: string[] }[] },
  ) {
    return new E_REQUEST_EXCEPTION(
      "Validation failed.",
      {
        errors: errors?.errors?.map((error) => ({
          message: error.message,
          field: error.path?.[0],
        })),
      },
      422,
    )
  }

  public static E_UNAUTHORIZED() {
    return new E_REQUEST_EXCEPTION("Unauthorized.", {}, 401)
  }
}

export function E_UNAUTHORIZED(): never {
  throw E_REQUEST_EXCEPTION.E_UNAUTHORIZED()
}

export function E_OPERATION_FAILED(message?: string) {
  throw new HTTPException(400, { message })
}

export function E_VALIDATION_FAILED(
  error: ZodError | { errors: { message: string; path: string[] }[] },
): never {
  throw E_REQUEST_EXCEPTION.E_VALIDATION_FAILED(error)
}
