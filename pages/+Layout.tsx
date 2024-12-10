import "./styles.css"
import React from "react"

function RootLayout({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="max-w-screen-2xl overflow-hidden mx-auto w-full h-screen border-l border-r kb-border-tertiary">
      {children}
    </div>
  )
}

export { RootLayout as Layout }
