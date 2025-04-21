import type { ContentfulStatusCode, StatusCode } from 'hono/utils/http-status'
import type {
  BaseIssue,
  BaseSchema,
  BaseSchemaAsync,
  EmailIssue,
  InferIssue,
  MaxLengthIssue,
  MinLengthIssue,
  NonEmptyIssue,
  RecordIssue,
  StringIssue,
} from 'valibot'

type ValibotValidationError =
  | InferIssue<BaseSchema<unknown, unknown, BaseIssue<unknown>>>
  | InferIssue<BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>>>
  | StringIssue
  | EmailIssue<string>
  | NonEmptyIssue<string>
  | RecordIssue
  | MinLengthIssue<string | unknown[], number>
  | MaxLengthIssue<string | unknown[], number>
  | { message?: string; field?: string }
  | undefined

export class E_REQUEST_EXCEPTION extends Error {
  constructor(
    public message: string,
    public payload?: unknown,
    public statusCode: ContentfulStatusCode = 500,
  ) {
    super(message ?? 'An error occurred.')
  }

  public static E_VALIDATION_FAILED(errors: ValibotValidationError[] | undefined) {
    return new E_REQUEST_EXCEPTION(
      'Validation failed.',
      {
        errors: errors?.map((error) => {
          const valibotError = error as InferIssue<
            BaseSchema<unknown, unknown, BaseIssue<unknown>>
          >
          const appError = error as { message?: string; field?: string }
          const fieldKey = valibotError?.path
            ? valibotError?.path?.map((path: { key: unknown }) => path.key).join('.')
            : appError?.field

          return {
            message: error?.message,
            field: fieldKey,
          }
        }),
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

  public static E_OPERATION_FAILED(message?: string, payload?: unknown) {
    return new E_REQUEST_EXCEPTION(
      `Internal server error${message ? `: ${message}` : '.'}`,
      payload,
      500,
    )
  }
}

export function E_UNAUTHORIZED(message?: string): never {
  throw E_REQUEST_EXCEPTION.E_UNAUTHORIZED(message)
}

export function E_OPERATION_FAILED(message?: string, payload?: unknown) {
  throw E_REQUEST_EXCEPTION.E_OPERATION_FAILED(message, payload)
}

export function E_VALIDATION_FAILED(error: ValibotValidationError[] | undefined): never {
  throw E_REQUEST_EXCEPTION.E_VALIDATION_FAILED(error)
}
