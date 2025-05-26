import React from 'react'

const ApiKeyCardIcon = React.forwardRef<
  React.ElementRef<'svg'>,
  React.ComponentPropsWithoutRef<'svg'>
>((props, forwardedRef) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24px"
    height="24px"
    fill="none"
    strokeWidth="1.5"
    color="#000"
    viewBox="0 0 24 24"
    {...props}
    ref={forwardedRef}
  >
    <title>Api key icon</title>
    <path
      stroke="#000"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10 3H5.6a.6.6 0 0 0-.6.6v16.8a.6.6 0 0 0 .6.6H10M11 7h2M11 12h2M11 17h2M14 3h4.4a.6.6 0 0 1 .6.6v16.8a.6.6 0 0 1-.6.6H14"
    />
  </svg>
))

export default ApiKeyCardIcon
