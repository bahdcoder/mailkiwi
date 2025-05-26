import React from 'react'

const BillingIcon = React.forwardRef<
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
    <title>Billing Icon</title>
    <path
      stroke="#000"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11 9h11M2 11l2.807-3.157A4 4 0 0 1 7.797 6.5H8M2 19.5h5.5l4-3s.81-.547 2-1.5c2.5-2 0-5.166-2.5-3.5C8.964 12.857 7 14 7 14"
    />
    <path
      stroke="#000"
      d="M8 13.5V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-6.5"
    />
  </svg>
))

export default BillingIcon
