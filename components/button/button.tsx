import React, { HTMLAttributes, PropsWithChildren } from "react"

export interface ButtonProps
  extends PropsWithChildren<HTMLAttributes<HTMLButtonElement>> {}

export function Button({ children }: ButtonProps) {
  return <button>{children}</button>
}
