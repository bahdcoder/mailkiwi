import "./layout.css"
import React, { PropsWithChildren } from "react"

function Layout({ children }: PropsWithChildren) {
  return (
    <>
      <ul className="w-full p-6 text-white bg-black flex items-center gap-x-6">
        <li>
          <a href="/">Home page</a>
        </li>
        <li>
          <a href="/about">About page</a>
        </li>
        <li>
          <a href="/products">Products page</a>
        </li>
      </ul>

      <main className="flex items-center p-8 flex-col">{children}</main>
    </>
  )
}

export { Layout }
