import { Root } from "./root"
import React from "react"
import {
  RenderToPipeableStreamOptions,
  renderToPipeableStream,
} from "react-dom/server"
import { StaticRouter } from "react-router-dom/server"

export function render(
  url: string,
  pageProps?: any,
  renderToPipeableStreamOptions?: RenderToPipeableStreamOptions,
) {
  const { pipe, abort } = renderToPipeableStream(
    <StaticRouter location={url} basename="/">
      <Root pageProps={pageProps} />
    </StaticRouter>,
    {
      ...renderToPipeableStreamOptions,
      bootstrapModules: ["/entry-client.tsx"],
      bootstrapScriptContent: /* javascript */ `
      
      `,
    },
  )

  return { pipe, abort }
}
