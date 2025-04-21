type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

interface HttpResponse<TData> {
  data: TData
  error: string | null
}

class HttpClient<TPayload extends object = object, TResponse = unknown> {
  private config: {
    url: string
    baseURL: string
    method: HttpMethod
    headers: Record<string, string>
    payload: TPayload
    as: 'json' | 'text'
  } = {
    url: '',
    baseURL: '',
    method: 'GET',
    payload: {} as TPayload,
    headers: {
      'Content-Type': 'application/json',
    },
    as: 'json',
  }

  baseURL(url: string) {
    this.config.baseURL = url

    return this
  }

  url(url: string) {
    this.config.url = url
    return this
  }

  asJson() {
    this.config.as = 'json'
    return this
  }

  asText() {
    this.config.as = 'text'
    return this
  }

  method(method: HttpMethod) {
    this.config.method = method
    return this
  }

  post() {
    this.config.method = 'POST'
    return this
  }

  get() {
    this.config.method = 'GET'
    return this
  }

  put() {
    this.config.method = 'PUT'
    return this
  }

  delete() {
    this.config.method = 'DELETE'
    return this
  }

  patch() {
    this.config.method = 'PATCH'
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

  private getRequestUrl() {
    return this.config.baseURL + this.config.url
  }

  async send<T extends TResponse>(): Promise<HttpResponse<T>> {
    try {
      const response = await fetch(this.getRequestUrl(), {
        method: this.config.method,
        headers: {
          ...this.config.headers,
        },
        body: this.config.method !== 'GET' ? JSON.stringify(this.config.payload) : null,
      })

      let data: unknown

      if (this.config.as === 'json') {
        data = await response.json()
      }

      if (this.config.as === 'text') {
        data = await response.text()
      }

      if (!response.ok) {
        throw new Error(
          typeof data === 'object' && data !== null && 'message' in data
            ? String(data.message)
            : 'Request failed',
        )
      }

      return { data: data as T, error: null }
    } catch (error: unknown) {
      return {
        data: null,
        error: error instanceof Error ? error.message : String(error),
      } as HttpResponse<T>
    }
  }
}

export const makeHttpClient = <TPayload extends object, TResponse>() =>
  new HttpClient<TPayload, TResponse>()
