import "./layout.css"
import React, { PropsWithChildren } from "react"

function Layout({ children }: PropsWithChildren) {
  return (
    <div className="w-full flex items-center h-screen bg-[#FAF9F7]">
      <div className="w-full lg:max-w-[240px] border-r-2 border-[#ECE9E7] h-full p-4">
        <a href="/community">Chat</a>
      </div>
      <div className="flex flex-grow w-full p-4">{children}</div>
    </div>
  )
}

export { Layout }
