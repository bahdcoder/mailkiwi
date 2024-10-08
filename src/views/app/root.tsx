import React, { useState } from "react"
import { Route, Routes } from "react-router-dom"

interface HomeProps {
  defaultCount: number
}

export function Home({ defaultCount = 0 }: HomeProps) {
  const [count, setCount] = useState(defaultCount)

  return (
    <button
      onClick={function () {
        setCount((current) => current + 1)
      }}
      style={{ fontSize: "32px" }}
    >
      Home count here:{count}
    </button>
  )
}

interface RootProps {
  pageProps: any
}

export function Root({ pageProps }: RootProps) {
  return (
    <Routes>
      <Route path="/" element={<Home {...pageProps} />} />
    </Routes>
  )
}
