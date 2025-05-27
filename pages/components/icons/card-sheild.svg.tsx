import React from 'react'

export const CardSheildIcon = React.forwardRef<
  React.ElementRef<'svg'>,
  React.ComponentPropsWithoutRef<'svg'>
>((props, forwardedRef) => {
  return (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        fill="none"
        strokeWidth="1.5"
        color="#000"
        viewBox="0 0 24 24"
        {...props}
        ref={forwardedRef}
      >
        <title>Card Sheild Icon</title>
        <path
          stroke="#000"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M22 9V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8M22 9H6m16 0v2"
        />
        <path
          stroke="#000"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m18.992 14.125 2.556.649c.266.068.453.31.445.584C21.821 21.116 18.5 22 18.5 22s-3.321-.884-3.493-6.642a.59.59 0 0 1 .445-.584l2.556-.649c.323-.082.661-.082.984 0"
        />
      </svg>
    </>
  )
})
