import '@hono/node-server'

declare module '@hono/node-server' {
  interface HttpBindings {
    _?: boolean
    // biome-ignore lint/suspicious/noExplicitAny: Hono type definitions
    incoming: any
    // biome-ignore lint/suspicious/noExplicitAny: Hono type definitions
    outgoing: any
  }
}
