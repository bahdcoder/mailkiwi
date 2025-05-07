import React from 'react'

export const ArrowUpRightIcon = React.forwardRef<
  React.ElementRef<'svg'>,
  React.ComponentPropsWithoutRef<'svg'>
>((props, forwardedRef) => {
  return (
    <svg
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      color="currentColor"
      {...props}
      ref={forwardedRef}
    >
      <title>Arrow Up Right Icon</title>
      <path
        d="M6.00005 19L19 5.99996M19 5.99996V18.48M19 5.99996H6.52005"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
})
