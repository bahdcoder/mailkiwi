import React from 'react'

export const FullWidthIcon = React.forwardRef<
  React.ElementRef<'svg'>,
  React.ComponentPropsWithoutRef<'svg'>
>((props, forwardedRef) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={16}
      height={16}
      viewBox="0 0 24 24"
      {...props}
      ref={forwardedRef}
    >
      <title>Full Width Icon</title>
      <g fill="currentColor">
        <path d="M2 5h20V3H2zm0 16h20v-2H2z" />
        <path fillRule="evenodd" d="M2 7v10h20V7zm2 2h16v6H4z" clipRule="evenodd" />
      </g>
    </svg>
  )
})
