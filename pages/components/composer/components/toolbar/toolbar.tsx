import cn from 'classnames'
import type React from 'react'

export interface ToolbarContainerProps extends React.PropsWithChildren {}

export function ToolbarContainer({ children }: ToolbarContainerProps) {
  return (
    <div className="flex items-center bg-(--background-inverse) gap-0.5 box-border rounded-lg p-1 shadow[0px_2px_0px_0px_var(--white-5)_inset,_0px_1px_0px_0px_var(--black-10)] z-10">
      {children}
    </div>
  )
}

export function ToolbarSection({
  children,
  divider = 'left',
}: React.PropsWithChildren<{ divider?: 'left' | 'right' | 'both' | 'none' }>) {
  return (
    <div
      className={cn('flex box-border border-(--white-10) px-1', {
        'border-l': divider === 'left',
        'border-r': divider === 'right',
        'border-l border-r': divider === 'both',
      })}
    >
      {children}
    </div>
  )
}

export interface ToolbarButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean
  as?: 'button' | 'span'
}

export function getToolbarClassNames(isActive: boolean) {
  return cn(
    'w-6 h-6 flex cursor-pointer transition-[background-color] duration-100 ease-in-out items-center justify-center rounded-md hover:text-white',
    {
      'bg-white bg-opacity-[0.08] text-white': isActive,
      'hover:bg-white hover:bg-opacity-[0.08] text-(--content-tertiary-inverse)':
        !isActive,
    },
  )
}

export function ToolbarButton({
  isActive,
  as = 'button',
  className,
  ...buttonProps
}: ToolbarButtonProps) {
  const Component = as

  return (
    <Component
      className={cn(
        'w-6 h-6 flex cursor-pointer transition-[background-color] duration-100 ease-in-out items-center justify-center rounded-md hover:text-white',
        {
          'bg-white bg-opacity-[0.08] text-white': isActive,
          'hover:bg-white hover:bg-opacity-[0.08] text-(--content-tertiary-inverse)':
            !isActive,
        },
        className,
      )}
      {...buttonProps}
    />
  )
}
