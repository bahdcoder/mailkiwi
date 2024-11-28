import React, { useState } from "react"
import { usePageContext } from "vike-react/usePageContext"

function Page() {
  const pageContext: any = usePageContext()

  return (
    <>
      <h1>The community page right here.</h1>
      {JSON.stringify(pageContext.pageProps)}
    </>
  )
}

export { Page }
