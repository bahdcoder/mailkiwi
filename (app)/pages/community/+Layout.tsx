import React, { PropsWithChildren } from "react"
import { usePageContext } from "vike-react/usePageContext"

function Layout({ children }: PropsWithChildren) {
  const pageContext: any = usePageContext()

  return (
    <div className="w-full flex items-center h-screen bg-[#FAF9F7]">
      <div className="w-full lg:max-w-[240px] border-r-2 border-[#ECE9E7] py-4 pr-4 h-screen overflow-y-auto">
        <h1 className="mb-4"> Community channels</h1>

        <div className="list-reset flex flex-col gap-4">
          {pageContext?.pageProps?.channels?.map((channel: any) => {
            return (
              <a
                key={channel.id}
                href={`/community/${channel?.name}`}
                className="w-full text-left py-2 rounded-lg hover:bg-gray-200 text-sm pl-3 cursor-pointer"
              >
                #{channel?.name}
              </a>
            )
          })}
        </div>
      </div>
      <div className="flex flex-grow w-full p-6 h-screen overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

export { Layout }
