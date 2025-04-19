import React, { type HTMLAttributes, type PropsWithChildren } from 'react'

export interface ButtonProps
  extends PropsWithChildren<HTMLAttributes<HTMLButtonElement>> {}

export function Button({ children }: ButtonProps) {
  return <button type="button">{children}</button>
}
