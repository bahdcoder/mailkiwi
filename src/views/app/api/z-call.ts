type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

type BeforeRequestHook = (config: RequestConfig) => RequestConfig
type AfterRequestHook = (response: Response) => Promise<Response>

interface RequestConfig {
  method: HttpMethod
  headers: Record<string, string>
  body?: BodyInit | null
  path: string
  queryParams?: Record<string, string>
}

interface ZCallConfig {
  basePath: string
  beforeRequestHook?: BeforeRequestHook
  afterRequestHook?: AfterRequestHook
}

export class ZCall {
  private basePath: string
  private beforeRequestHook?: BeforeRequestHook
  private afterRequestHook?: AfterRequestHook

  constructor(config?: ZCallConfig) {
    this.basePath = config?.basePath ?? "/"
    this.beforeRequestHook = config?.beforeRequestHook
    this.afterRequestHook = config?.afterRequestHook
  }

  private async request<T, E = Error>(
    defaultConfig: RequestConfig,
  ): Promise<[T, E | null]> {
    try {
      let config: RequestConfig = defaultConfig

      if (this.beforeRequestHook) {
        config = { ...defaultConfig, ...this.beforeRequestHook(defaultConfig) }
      }

      const url = new URL(window.location.origin + this.basePath + config.path)

      if (config.queryParams) {
        for (const [key, value] of Object.entries(config.queryParams)) {
          url.searchParams.append(key, value)
        }
      }

      const response = await fetch(url.toString(), {
        method: config.method,
        headers: config.headers,
        body: config.body,
      })

      let finalResponse = response
      if (this.afterRequestHook) {
        finalResponse = await this.afterRequestHook(response.clone())
      }

      if (!finalResponse.ok) {
        const errorBody = await finalResponse.json()
        return [null, errorBody] as unknown as Promise<[T, E | null]>
      }

      const data = await finalResponse.json()
      return [data as T, null]
    } catch (error) {
      return [
        null,
        error instanceof Error ? error : new Error(String(error)),
      ] as unknown as Promise<[T, E | null]>
    }
  }

  async get<T, E = Error>(
    path: string,
    queryParams?: Record<string, string>,
  ): Promise<[T, E | null]> {
    return this.request<T, E>({ method: "GET", headers: {}, path, queryParams })
  }

  async post<T, E = Error>(
    path: string,
    body: BodyInit | object,
    headers?: Record<string, string>,
  ): Promise<[T, E | null]> {
    const [finalBody, finalHeaders] = this.prepareBodyAndHeaders(body, headers)
    return this.request<T, E>({
      method: "POST",
      headers: finalHeaders,
      body: finalBody,
      path,
    })
  }

  async put<T, E = Error>(
    path: string,
    body: BodyInit | object,
    headers?: Record<string, string>,
  ): Promise<[T, E | null]> {
    const [finalBody, finalHeaders] = this.prepareBodyAndHeaders(body, headers)
    return this.request<T, E>({
      method: "PUT",
      headers: finalHeaders,
      body: finalBody,
      path,
    })
  }

  async patch<T, E = Error>(
    path: string,
    body: BodyInit | object,
    headers?: Record<string, string>,
  ): Promise<[T, E | null]> {
    const [finalBody, finalHeaders] = this.prepareBodyAndHeaders(body, headers)
    return this.request<T, E>({
      method: "PATCH",
      headers: finalHeaders,
      body: finalBody,
      path,
    })
  }

  async delete<T, E = Error>(
    path: string,
    body?: BodyInit,
    headers?: Record<string, string>,
  ): Promise<[T, E | null]> {
    return this.request<T, E>({
      method: "DELETE",
      headers: headers || {},
      body,
      path,
    })
  }

  private prepareBodyAndHeaders(
    body: object | BodyInit | undefined,
    headers?: Record<string, string>,
  ): [BodyInit, Record<string, string>] {
    let finalBody: BodyInit
    const finalHeaders: Record<string, string> = { ...headers }

    if (
      body &&
      typeof body === "object" &&
      !(body instanceof Blob) &&
      !(body instanceof FormData) &&
      !(body instanceof URLSearchParams)
    ) {
      finalBody = JSON.stringify(body)
      finalHeaders["Content-Type"] = "application/json"
    } else {
      finalBody = body as BodyInit
    }

    return [finalBody, finalHeaders]
  }
}
