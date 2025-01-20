import { ComposeBroadcastFlow } from "@/pages/components/flows/compose_broadcast/compose_broadcast_flow.jsx"
import { Button } from "@kibamail/owly/button"
import { Heading } from "@kibamail/owly/heading"
import React from "react"

import { route } from "@/shared/routes/route_aliases.js"

export interface ProductPageHeadingProps extends React.PropsWithChildren {
  header?: React.ReactNode
}

export function ProductPageHeading({ children, header }: ProductPageHeadingProps) {
  return (
    <div className="w-full pt-6 flex flex-col sticky top-0 kb-background-secondary z-[2]">
      {header ? (
        header
      ) : (
        <div className="w-full flex flex-col md:flex-row md:items-center md:justify-between">
          <Heading variant="display" size="xs">
            Engage
          </Heading>

          <Button asChild>
            <a href={route("broadcasts_composer")}>Compose a broadcast</a>
          </Button>
        </div>
      )}

      {children}
    </div>
  )
}
