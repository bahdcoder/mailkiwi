import type { Button } from '@kibamail/owly/button'
import { Slot } from '@radix-ui/react-slot'
import cn from 'classnames'
import React from 'react'

type ButtonCardProps = React.ComponentPropsWithoutRef<typeof Button>

export const ButtonCard = React.forwardRef<React.ElementRef<'button'>, ButtonCardProps>(
  ({ asChild, className, ...buttonProps }, forwardedRef) => {
    const Component = asChild ? Slot : 'button'

    return (
      <Component
        {...buttonProps}
        ref={forwardedRef}
        className={cn(
          'w-full p-5 flex flex-col rounded-xl hover:bg-(--background-hover) border-t border-l border-r border-b-2 shadow-[0_2px_0px_0px_var(--white-5)_inset,0px_1px_0px_0px_var(--black-10)] kb-border-tertiary',
          className,
        )}
      />
    )
  },
)
