import { Button } from "@kibamail/owly/button"
import { Heading } from "@kibamail/owly/heading"
import React from "react"

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

          <Button>Compose a broadcast</Button>
        </div>
      )}

      {children}
    </div>
  )
}
