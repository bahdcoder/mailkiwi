import cn from "classnames"
import React from "react"

export interface ToolbarContainerProps extends React.PropsWithChildren {}

export function ToolbarContainer({ children }: ToolbarContainerProps) {
  return (
    <div className="flex items-center bg-[var(--background-inverse)] gap-0.5 box-border rounded-lg p-1 shadow[0px_2px_0px_0px_var(--white-5)_inset,_0px_1px_0px_0px_var(--black-10)]">
      {children}
    </div>
  )
}

export interface ToolbarButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean
}

export function ToolbarButton({
  isActive,
  className,
  ...buttonProps
}: ToolbarButtonProps) {
  return (
    <button
      className={cn(
        "w-6 h-6 flex cursor-pointer transition-[background-color] duration-100 ease-in-out items-center justify-center rounded-md",
        {
          "bg-white bg-opacity-[0.08] text-white": isActive,
          "hover:bg-white hover:bg-opacity-[0.08] text-[var(--content-tertiary-inverse)]":
            !isActive,
        },
        className,
      )}
      {...buttonProps}
    />
  )
}
