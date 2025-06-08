import React from 'react'

export const HeadingMarkerIcon = React.forwardRef<
  React.ElementRef<'svg'>,
  React.ComponentPropsWithoutRef<'svg'>
>((props, forwardedRef) => {
  return (
    <svg
      width="16"
      height="40"
      viewBox="0 0 16 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
      ref={forwardedRef}
    >
      <title>Heading marker</title>
      <path
        d="M8 0.5C12.1421 0.5 15.5 3.85786 15.5 8V32C15.5 36.1421 12.1421 39.5 8 39.5C3.85786 39.5 0.5 36.1421 0.5 32V8C0.5 3.85786 3.85786 0.5 8 0.5Z"
        stroke="currentColor"
      />
    </svg>
  )
})
