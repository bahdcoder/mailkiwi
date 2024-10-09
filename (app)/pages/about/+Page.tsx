import React, { useState } from "react"
import { usePageContext } from "vike-react/usePageContext"

function Page() {
  const pageContext: any = usePageContext()

  const [counter, setCounter] = useState<number>(
    pageContext.pageProps?.defaultCount,
  )

  return (
    <>
      <h1>About</h1>
      <p>This app showcases a migration from Vite to Vike.</p>

      <button
        onClick={function () {
          setCounter((current) => current + 1)
        }}
        className="h-12 flex items-center justify-center px-12 rounded-lg bg-red-500 font-bold text-white"
      >
        Count {counter}
      </button>
    </>
  )
}

export { Page }
