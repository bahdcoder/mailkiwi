import React from 'react'

export const OptimiseIcon = React.forwardRef<
  React.ElementRef<'svg'>,
  React.ComponentPropsWithoutRef<'svg'>
>((props, forwardedRef) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={14}
      height={16}
      viewBox="0 0 14 16"
      fill="none"
      {...props}
      ref={forwardedRef}
    >
      <title>Optimise Icon</title>
      <g clipPath="url(#clip0_196_1322)">
        <path
          d="M7.67572 8.91054H5.25391V1.64099C5.25391 0.974174 5.79595 0.432129 6.46277 0.432129H7.67777C8.34459 0.432129 8.88663 0.974174 8.88663 1.64099V6.48872H7.67572V1.64099H6.46277V7.69758H7.67368V8.90849L7.67572 8.91054Z"
          fill="#FA8A00"
        />
        <path
          d="M13.7342 15.5727H0.410156V10.8047C0.410156 9.09266 1.80311 7.69971 3.51516 7.69971H10.6292C12.3413 7.69971 13.7342 9.09266 13.7342 10.8047V15.5727ZM1.62107 14.3618H12.5233V10.8047C12.5233 9.75948 11.6745 8.91062 10.6292 8.91062H3.51516C2.46993 8.91062 1.62107 9.75948 1.62107 10.8047V14.3618Z"
          fill="#FA8A00"
        />
        <path d="M4.6445 10.7251H3.43359V14.9674H4.6445V10.7251Z" fill="#FA8A00" />
        <path d="M7.67185 10.7251H6.46094V14.9674H7.67185V10.7251Z" fill="#FA8A00" />
        <path d="M10.6992 10.7251H9.48828V14.9674H10.6992V10.7251Z" fill="#FA8A00" />
      </g>
      <defs>
        <clipPath id="clip0_196_1322">
          <rect
            width="13.3241"
            height="15.1405"
            fill="white"
            transform="translate(0.410156 0.432129)"
          />
        </clipPath>
      </defs>
    </svg>
  )
})
