import type { Context as BaseHonoContext, Handler, MiddlewareHandler } from 'hono'

/**
 * Standard HTTP method strings
 */
export type _HTTPMethods =
  | 'DELETE'
  | 'GET'
  | 'HEAD'
  | 'PATCH'
  | 'POST'
  | 'PUT'
  | 'OPTIONS'
  | 'PROPFIND'
  | 'PROPPATCH'
  | 'MKCOL'
  | 'COPY'
  | 'MOVE'
  | 'LOCK'
  | 'UNLOCK'
  | 'TRACE'
  | 'SEARCH'
  | 'REPORT'
  | 'MKCALENDAR'

export type HTTPMethods = Uppercase<_HTTPMethods> | Lowercase<_HTTPMethods>

export type HonoRouteDefinition = [
  HTTPMethods,
  string,
  Handler,
  middleware?: MiddlewareHandler[],
]

export type HonoContext = BaseHonoContext<{
  Bindings: { _?: boolean }
}>
