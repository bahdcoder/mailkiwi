import React from 'react'

export const XMarkCircleIcon = React.forwardRef<
  React.ElementRef<'svg'>,
  React.ComponentPropsWithoutRef<'svg'>
>((props, forwardedRef) => {
  return (
    <svg
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="X Mark Circle"
      {...props}
      ref={forwardedRef}
    >
      <title>X Mark Circle</title>
    </svg>
  )
})

XMarkCircleIcon.displayName = 'XMarkCircleIcon'
