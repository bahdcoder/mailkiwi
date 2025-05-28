import * as Popover from '@radix-ui/react-popover'
import cn from 'classnames'
import React from 'react'

const PopoverContent = React.forwardRef<HTMLDivElement, Popover.PopoverContentProps>(
  (props, ref) => (
    <Popover.Content
      align="start"
      sideOffset={4}
      {...props}
      className={cn(
        'z-50 max-w-96 overflow-hidden border kb-border-tertiary rounded-xl shadow-[0px_16px_24px_-8px_var(--black-10)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 bg-(--background-primary) p-4',
        props.className,
      )}
      ref={ref}
    />
  ),
)

const PopoverRoot = Popover.Root
const PopoverTrigger = Popover.Trigger

const PopoverArrow = Popover.Arrow
const PopoverPortal = Popover.Portal

export {
  PopoverContent as Content,
  PopoverRoot as Root,
  PopoverTrigger as Trigger,
  PopoverArrow as Arrow,
  PopoverPortal as Portal,
}
