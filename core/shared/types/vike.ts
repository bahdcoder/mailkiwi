import type { Next } from 'hono'
import type { renderPage } from 'vike/server'
import { PageContextServer } from 'vike/types'
import type { HonoContext } from '../server/types.js'

export type VikePageContextInit = {
  urlOriginal: string
  pageProps?: Record<string, unknown>
  headersOriginal?: Request['headers']
}

export type VikeRenderPage = typeof renderPage

export type VikePageRenderer = (
  ctx: HonoContext,
  next: Next,
  pageProps?: Record<string, unknown>,
) => Promise<unknown>
