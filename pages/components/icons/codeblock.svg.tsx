import React from 'react'

export const CodeBlockIcon = React.forwardRef<
  React.ElementRef<'svg'>,
  React.ComponentPropsWithoutRef<'svg'>
>((props, forwardedRef) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={16}
      height={16}
      viewBox="0 0 16 16"
      fill="none"
      {...props}
      ref={forwardedRef}
    >
      <title>Code Block Icon</title>
      <path
        d="M2 5V3.33333C2 2.59695 2.59695 2 3.33333 2L12.6667 2C13.403 2 14 2.59695 14 3.33333V5M14 11V12.6667C14 13.403 13.403 14 12.6667 14H3.33333C2.59695 14 2 13.403 2 12.6667V11"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.3332 5.66659L12.6665 7.99992L10.3332 10.3333"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.66683 5.66659L3.3335 7.99992L5.66683 10.3333"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
})
