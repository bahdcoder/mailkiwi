import "./styles.css"
import React from "react"

function RootLayout({ children }: React.PropsWithChildren<{}>) {
  return <>{children}</>
}

export { RootLayout as Layout }
