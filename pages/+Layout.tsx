import "./styles.css"
import React from "react"

function RootLayout({ children }: React.PropsWithChildren<{}>) {
  {
    /*  max-w-screen-2xl overflow-hidden mx-auto*/
  }

  return (
    <div className="w-full h-screen border-l border-r kb-border-tertiary">{children}</div>
  )
}

export { RootLayout as Layout }
