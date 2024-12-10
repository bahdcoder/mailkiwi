import { composeRefs } from "@radix-ui/react-compose-refs"
import {
  DefaultError,
  MutationOptions,
  UseMutationResult,
  useMutation,
} from "@tanstack/react-query"
import React from "react"
import { navigate } from "vike/client/router"

export interface ServerSubmissionResponse<TResponse = Record<"path" | string, any>> {
  type: "redirect" | "json"
  payload: TResponse
  success: boolean
  message: string
  errors: Record<"field" | "message", string>[]
  errorsMap: Record<string, string>
}

export interface UseServerFormMutationProps
  extends Omit<
    MutationOptions<
      ServerSubmissionResponse,
      ServerSubmissionResponse,
      Record<string, FormDataEntryValue>
    >,
    "mutationFn"
  > {
  action: string
  method?: "POST" | "PUT" | "DELETE" | "PATCH"
}

export function useServerFormMutation({
  action,
  method = "POST",
  ...mutationOptions
}: UseServerFormMutationProps) {
  const mutation = useMutation({
    async mutationFn(form) {
      const response = await fetch(action, {
        method,
        body: JSON.stringify(form),
        headers: {
          "Content-Type": "application/json",
        },
      })

      const submissionResponse: ServerSubmissionResponse = await response.json()

      if (submissionResponse?.payload?.errors) {
        submissionResponse.errorsMap = {}
        for (const error of submissionResponse?.payload?.errors) {
          submissionResponse.errorsMap[error.field] = error.message
        }
      }

      if (!response.ok) {
        throw submissionResponse
      }

      if (submissionResponse.type === "redirect") {
        await (navigate as any)(submissionResponse.payload.path)
      }

      return submissionResponse
    },
    ...mutationOptions,
  })

  return {
    action,
    method,
    ...mutation,
    serverFormProps: { method, action, mutate: mutation.mutate },
  }
}

type ServerFormProps = React.FormHTMLAttributes<HTMLFormElement> & {
  mutate: UseMutationResult<
    ServerSubmissionResponse<Record<string, any>>,
    ServerSubmissionResponse,
    Record<string, FormDataEntryValue>,
    unknown
  >["mutate"]
}

export const ServerForm = React.forwardRef<React.ElementRef<"form">, ServerFormProps>(
  ({ children, method, mutate, action, ...formProps }, forwardedRef) => {
    const isUnsupportedRequestmethod = method !== "POST"
    const formRef = React.useRef<HTMLFormElement>(null)

    function onFormSubmit(event: React.FormEvent<HTMLFormElement>) {
      event.preventDefault()

      const formElement = formRef.current

      if (!formElement) {
        return
      }

      const form = new FormData(formElement)

      const payload: Record<string, FormDataEntryValue> = {}

      for (const [name, value] of form.entries()) {
        payload[name] = value
      }

      mutate(payload)
    }

    // TODO: Automatically inject CSRF token into form here.

    return (
      <form
        {...formProps}
        action={action}
        method={"POST"}
        onSubmit={onFormSubmit}
        ref={composeRefs(formRef, forwardedRef)}
      >
        {isUnsupportedRequestmethod ? (
          <input type="hidden" name="_method" defaultValue={method} />
        ) : null}
        {children}
      </form>
    )
  },
)
