import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import cn from 'classnames'
import React from 'react'

const DropdownContent = React.forwardRef<
  HTMLDivElement,
  DropdownMenu.DropdownMenuContentProps
>((props, ref) => (
  <DropdownMenu.Content
    align="start"
    {...props}
    className={cn(
      'z-50 min-w-52 overflow-hidden border kb-border-tertiary rounded-xl p-1 shadow-[0px_16px_24px_-8px_var(--black-10)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 bg-(--background-primary) gap-1',
      props.className,
    )}
    sideOffset={4}
    ref={ref}
  />
))

const DropdownMenuRoot = DropdownMenu.Root
const DropdownMenuTrigger = DropdownMenu.Trigger
const DropdownMenuItem = DropdownMenu.Item
const DropdownMenuGroup = DropdownMenu.Group
const DropdownMenuLabel = DropdownMenu.Label
const DropdownMenuSeparator = DropdownMenu.Separator
const DropdownMenuArrow = DropdownMenu.Arrow
const DropdownMenuPortal = DropdownMenu.Portal

export {
  DropdownContent as Content,
  DropdownMenuRoot as Root,
  DropdownMenuTrigger as Trigger,
  DropdownMenuItem as Item,
  DropdownMenuGroup as Group,
  DropdownMenuLabel as Label,
  DropdownMenuSeparator as Separator,
  DropdownMenuArrow as Arrow,
  DropdownMenuPortal as Portal,
}
