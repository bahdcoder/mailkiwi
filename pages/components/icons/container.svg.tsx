import React from 'react'

export const ContainerIcon = React.forwardRef<
  React.ElementRef<'svg'>,
  React.ComponentPropsWithoutRef<'svg'>
>((props, forwardedRef) => {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
      ref={forwardedRef}
    >
      <title>Container Icon</title>
      <path
        d="M2.1 8.16675L11.9 8.16675C12.0933 8.16675 12.25 8.32345 12.25 8.51675L12.25 11.9001C12.25 12.0934 12.0933 12.2501 11.9 12.2501L2.1 12.2501C1.9067 12.2501 1.75 12.0934 1.75 11.9001L1.75 8.51675C1.75 8.32345 1.9067 8.16675 2.1 8.16675Z"
        stroke="currentColor"
        strokeWidth="0.875"
      />
      <path
        d="M2.1 1.75L11.9 1.75C12.0933 1.75 12.25 1.9067 12.25 2.1L12.25 5.48333C12.25 5.67663 12.0933 5.83333 11.9 5.83333L2.1 5.83333C1.9067 5.83333 1.75 5.67663 1.75 5.48333L1.75 2.1C1.75 1.9067 1.9067 1.75 2.1 1.75Z"
        stroke="currentColor"
        strokeWidth="0.875"
      />
    </svg>
  )
})
