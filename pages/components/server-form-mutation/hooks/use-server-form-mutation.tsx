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
  errorsList: string[]
}

export interface UseServerFormMutationProps<TResponse = Record<"path" | string, any>>
  extends Omit<
    MutationOptions<
      ServerSubmissionResponse<TResponse>,
      ServerSubmissionResponse<TResponse>,
      Record<string, FormDataEntryValue>
    >,
    "mutationFn"
  > {
  action: string
  method?: "POST" | "PUT" | "DELETE" | "PATCH"
  onProgress?: XHRHelperConfig["onProgress"]
}

export function useServerFormMutation<T extends Record<"path" | string, any>>({
  action,
  method = "POST",
  onProgress,
  ...mutationOptions
}: UseServerFormMutationProps<T>) {
  const mutation = useMutation({
    async mutationFn(form) {
      let isAMultiPartRequest = false

      for (const key in form) {
        if (form[key] instanceof File) {
          isAMultiPartRequest = true
          break
        }
      }

      const multipartForm = new FormData()

      if (isAMultiPartRequest) {
        for (const key in form) {
          if (form[key] instanceof File) {
            multipartForm.append(key, form[key])
          } else {
            multipartForm.set(key, form[key])
          }
        }
      }

      let response: Response

      if (isAMultiPartRequest) {
        response = await xhrHelper({
          method,
          onProgress,
          url: action,
          formData: multipartForm,
        })
      } else {
        response = await fetch(action, {
          method,
          body: JSON.stringify(form),
          headers: {
            "Content-Type": "application/json",
          },
        })
      }

      const submissionResponse: ServerSubmissionResponse = await response.json()

      if (submissionResponse?.payload?.errors) {
        submissionResponse.errorsMap = {}
        submissionResponse.errorsList = []

        for (const error of submissionResponse?.payload?.errors) {
          submissionResponse.errorsMap[error.field] = error.message

          submissionResponse.errorsList.push(error.message)
        }
      }

      if (!response.ok) {
        throw submissionResponse
      }

      if (submissionResponse.type === "redirect") {
        await (navigate as any)(submissionResponse.payload.path)
      }

      return submissionResponse as ServerSubmissionResponse<T>
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

interface XHRHelperConfig {
  formData: FormData
  url: string
  method?: UseServerFormMutationProps["method"]
  onProgress?: (progress: {
    percent: number
    loaded: number
    total: number | null
  }) => void
}

function xhrHelper<T>(config: XHRHelperConfig): Promise<any> {
  const { formData, url, method = "POST", onProgress } = config

  async function json(payload: any) {
    return payload
  }

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest()
    xhr.open(method, url, true)

    xhr.onload = () => {
      const jsonResponse: T = JSON.parse(xhr.responseText)

      resolve({
        ok: xhr.status >= 200 && xhr.status < 300,
        json: () => json(jsonResponse),
      })
    }

    xhr.onerror = () => {
      resolve({
        ok: false,
        json: () => json({ message: "Network error occurred during the request." }),
      })
    }

    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        const percent = event.lengthComputable ? (event.loaded / event.total) * 100 : 0
        onProgress({
          percent: Math.ceil(percent),
          loaded: event.loaded,
          total: event.lengthComputable ? event.total : null,
        })
      }
    }

    xhr.send(formData)
  })
}
