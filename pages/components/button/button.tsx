import React, { type HTMLAttributes, type PropsWithChildren } from 'react'

interface ButtonProps extends PropsWithChildren<HTMLAttributes<HTMLButtonElement>> {}

export function Button({ children }: ButtonProps) {
  return <button type="button">{children}</button>
}
