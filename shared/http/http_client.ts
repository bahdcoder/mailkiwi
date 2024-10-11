type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH"

interface HttpResponse<TData> {
  data: TData
  error: string | null
}

class HttpClient<TPayload extends object = object, TResponse = unknown> {
  private config: {
    url: string
    method: HttpMethod
    headers: Record<string, string>
    payload: TPayload
    as: "json" | "text"
  } = {
    url: "",
    method: "GET",
    payload: {} as TPayload,
    headers: {
      "Content-Type": "application/json",
    },
    as: "json",
  }

  url(url: string) {
    this.config.url = url
    return this
  }

  asJson() {
    this.config.as = "json"
    return this
  }

  asText() {
    this.config.as = "text"
    return this
  }

  method(method: HttpMethod) {
    this.config.method = method
    return this
  }

  post() {
    this.config.method = "POST"
    return this
  }

  get() {
    this.config.method = "GET"
    return this
  }

  put() {
    this.config.method = "PUT"
    return this
  }

  delete() {
    this.config.method = "DELETE"
    return this
  }

  patch() {
    this.config.method = "PATCH"
    return this
  }

  payload(payload: TPayload) {
    this.config.payload = payload
    return this
  }

  headers(headers: Record<string, string>) {
    this.config.headers = { ...this.config.headers, ...headers }
    return this
  }

  async send(): Promise<HttpResponse<TResponse>> {
    try {
      const response = await fetch(this.config.url, {
        method: this.config.method,
        headers: {
          ...this.config.headers,
        },
        body:
          this.config.method !== "GET"
            ? JSON.stringify(this.config.payload)
            : null,
      })

      let data: any

      if (this.config.as === "json") {
        data = await response.json()
      }

      if (this.config.as === "text") {
        data = await response.text()
      }

      if (!response.ok) {
        throw new Error((data as any)?.message || "Request failed")
      }

      return { data, error: null }
    } catch (error: any) {
      return {
        data: null,
        error: error.message,
      } as HttpResponse<TResponse>
    }
  }
}

export const makeHttpClient = <TPayload extends object, TResponse>() =>
  new HttpClient<TPayload, TResponse>()
