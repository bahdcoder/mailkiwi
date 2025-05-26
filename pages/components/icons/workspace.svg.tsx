import React from 'react'

const WorkspaceIcon = React.forwardRef<
  React.ElementRef<'svg'>,
  React.ComponentPropsWithoutRef<'svg'>
>((props, forwardedRef) => (
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
    <title>Workspace Icon</title>
    <path
      stroke="#000"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m10 9.01.01-.011M14 9.01l.01-.011M10 13.01l.01-.011M14 13.01l.01-.011M10 17.01l.01-.011M14 17.01l.01-.011M6 20.4V5.6a.6.6 0 0 1 .6-.6H12V3.6a.6.6 0 0 1 .6-.6h4.8a.6.6 0 0 1 .6.6v16.8a.6.6 0 0 1-.6.6H6.6a.6.6 0 0 1-.6-.6"
    />
  </svg>
))
export default WorkspaceIcon
