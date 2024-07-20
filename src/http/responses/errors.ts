/* eslint-disable @typescript-eslint/no-explicit-any */

import { HTTPException } from "hono/http-exception"
import { StatusCode } from "hono/utils/http-status"
import { BaseSchema, BaseSchemaAsync, InferIssue } from "valibot"

type ValibotValidationError =
  | InferIssue<BaseSchema<any, any, any>>
  | InferIssue<BaseSchemaAsync<any, any, any>>
  | { message?: string; field?: string }

export class E_REQUEST_EXCEPTION extends Error {
  constructor(
    public message: string,
    public payload?: object,
    public statusCode: StatusCode = 500,
  ) {
    super(message ?? "An error occurred.")
  }

  public static E_VALIDATION_FAILED(errors: ValibotValidationError[]) {
    return new E_REQUEST_EXCEPTION(
      "Validation failed.",
      {
        errors: errors?.map((error) => ({
          message: error?.message,
          field: error?.path?.[0]?.["key"] ?? error?.field,
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

export function E_VALIDATION_FAILED(error: ValibotValidationError[]): never {
  throw E_REQUEST_EXCEPTION.E_VALIDATION_FAILED(error)
}
