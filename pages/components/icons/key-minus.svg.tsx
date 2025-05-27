import React from 'react'

export const KeyMinusIcon = React.forwardRef<
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
        <title>Key Minus Icon</title>
        <path
          stroke="#000"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.992 18h6M12.412 10.343a4 4 0 1 0 5.657-5.657 4 4 0 0 0-5.657 5.657m0 0-8.485 8.485 2.121 2.122M6.755 16l2.122 2.121"
        />
      </svg>
    </>
  )
})
