import React, { lazy, useState } from "react"
import { Link, Route, Routes } from "react-router-dom"

const Home = lazy(() => import("./pages/home"))
const About = lazy(() => import("./pages/about"))

interface RootProps {
  pageProps: any
}

export function Root({ pageProps }: RootProps) {
  return (
    <>
      <html>
        <head>
          <meta charSet="utf-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1"
          />
          <title>Kibamail</title>
        </head>
        <body>
          <nav>
            <Link to="/">Home page</Link>
            <Link to="/about">About page</Link>
          </nav>
          <Routes>
            <Route path="/" element={<Home {...pageProps} />} />
            <Route path="/about" element={<About {...pageProps} />} />
          </Routes>
        </body>

        {/* <script src="/entry-client.tsx"></script> */}
      </html>
    </>
  )
}
