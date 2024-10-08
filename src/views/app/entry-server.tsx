import { Root } from "./root"
import React from "react"
import { renderToString } from "react-dom/server"
import { StaticRouter } from "react-router-dom/server"

export function render(url: string, pageProps?: any) {
  return renderToString(
    <StaticRouter location={url} basename="/">
      <Root pageProps={pageProps} />
    </StaticRouter>,
  )
}
