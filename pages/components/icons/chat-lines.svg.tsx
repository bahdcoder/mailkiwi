import React from 'react'

const ChatLinesIcon = React.forwardRef<
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
    <title>Chat Lines Icon</title>
    <path
      stroke="#000"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 10h8M8 14h4M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12c0 1.821.487 3.53 1.338 5L2.5 21.5l4.5-.838A9.96 9.96 0 0 0 12 22"
    />
  </svg>
))

export default ChatLinesIcon
