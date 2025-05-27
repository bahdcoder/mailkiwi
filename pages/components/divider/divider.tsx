import classNames from 'classnames'
import clsx from 'clsx'

interface DividerProps {
  className?: string
}

export function Divider({ className }: DividerProps) {
  const baseStyleClasses = 'my-8'
  return (
    <div
      className={clsx(
        'bg-(--border-tertiary) w-full h-px',
        !className ? baseStyleClasses : classNames,
      )}
    />
  )
}
