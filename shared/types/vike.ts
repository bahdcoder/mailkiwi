import { HonoContext } from "../server/types.js"
import { Next } from "hono"
import { renderPage } from "vike/server"
import { PageContextServer } from "vike/types"

export type VikePageContextInit = {
  urlOriginal: string
  pageProps?: Record<string, any>
  headersOriginal?: Request["headers"]
}

export type VikeRenderPage = typeof renderPage

export type VikePageRenderer = (
  ctx: HonoContext,
  next: Next,
  pageProps?: Record<string, any>,
) => any
