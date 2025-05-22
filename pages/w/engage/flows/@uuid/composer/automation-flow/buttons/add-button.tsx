import { PlusIcon } from '@pages/components/icons/plus.svg.jsx'
import { Button } from '@kibamail/owly/button'
import React, { type HTMLAttributes, type PropsWithChildren } from 'react'

export interface AddEdgeButtonProps
  extends PropsWithChildren<HTMLAttributes<HTMLButtonElement>> {}

export function AddEdgeButton({ onClick }: AddEdgeButtonProps) {
  return (
    <Button
      variant="primary"
      onClick={onClick}
      className="kb-background-info border-[var(--black-5)] rounded-lg w-7 h-7 p-0 flex items-center justify-center"
      style={{ pointerEvents: 'all' }}
    >
      <PlusIcon />
    </Button>
  )
}
