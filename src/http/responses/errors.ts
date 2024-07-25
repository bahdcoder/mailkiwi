import type { StatusCode } from 'hono/utils/http-status'
import type { BaseSchema, BaseSchemaAsync, InferIssue } from 'valibot'

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
    super(message ?? 'An error occurred.')
  }

  public static E_VALIDATION_FAILED(errors: ValibotValidationError[]) {
    return new E_REQUEST_EXCEPTION(
      'Validation failed.',
      {
        errors: errors?.map((error) => ({
          message: error?.message,
          field: error?.path?.[0]?.key ?? error?.field,
        })),
      },
      422,
    )
  }

  public static E_UNAUTHORIZED(message?: string) {
    return new E_REQUEST_EXCEPTION(
      `Unauthorized${message ? `: ${message}` : '.'}`,
      {},
      401,
    )
  }

  public static E_OPERATION_FAILED(message?: string) {
    return new E_REQUEST_EXCEPTION(
      `Internal server error${message ? `: ${message}` : '.'}`,
      {},
      500,
    )
  }
}

export function E_UNAUTHORIZED(message?: string): never {
  throw E_REQUEST_EXCEPTION.E_UNAUTHORIZED(message)
}

export function E_OPERATION_FAILED(message?: string) {
  throw E_REQUEST_EXCEPTION.E_OPERATION_FAILED(message)
}

export function E_VALIDATION_FAILED(error: ValibotValidationError[]): never {
  throw E_REQUEST_EXCEPTION.E_VALIDATION_FAILED(error)
}
