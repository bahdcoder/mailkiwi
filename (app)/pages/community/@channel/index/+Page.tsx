import React, { useState } from "react"
import { usePageContext } from "vike-react/usePageContext"

function Page() {
  const pageContext: any = usePageContext()

  return (
    <>
      <div className="h-screen bg-gray-100 flex flex-col gap-y-4 w-full">
        {pageContext.pageProps?.messages?.data?.map((message: any) => {
          return (
            <a
              key={message.id}
              className="p-4 bg-blue-500 text-white w-full rounded-lg font-semibold"
              href={`/community/${pageContext.pageProps?.channel?.name}/m/${message.id}/replies`}
            >
              {message?.id}
            </a>
          )
        })}
      </div>
    </>
  )
}

export { Page }
