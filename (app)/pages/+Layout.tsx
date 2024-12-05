import "./layout.css"
import React, { PropsWithChildren } from "react"

function Layout({ children }: PropsWithChildren) {
  return <div>{children}</div>
}

export { Layout }
