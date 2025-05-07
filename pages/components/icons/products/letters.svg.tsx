import React from 'react'

export const LettersIcon = React.forwardRef<
  React.ElementRef<'svg'>,
  React.ComponentPropsWithoutRef<'svg'>
>((props, forwardedRef) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={18}
      height={13}
      viewBox="0 0 18 13"
      fill="none"
      {...props}
      ref={forwardedRef}
    >
      <title>Letters Icon</title>
      <g clipPath="url(#clip0_196_1198)">
        <path
          d="M16.3603 12.9983H1.88871C1.1728 12.9983 0.589844 12.4153 0.589844 11.6994V2.15531C0.589844 1.4394 1.1728 0.856445 1.88871 0.856445H16.2887C17.0046 0.856445 17.5876 1.4394 17.5876 2.15531V4.4994H16.3726V2.15531C16.3726 2.10826 16.3337 2.0694 16.2867 2.0694H1.88871C1.84166 2.0694 1.8028 2.10826 1.8028 2.15531V11.6994C1.8028 11.7464 1.84166 11.7853 1.88871 11.7853H16.3603C16.3603 11.7853 16.3746 11.7792 16.3746 11.771V6.32804H17.5896V11.771C17.5896 12.448 17.0394 12.9983 16.3623 12.9983H16.3603Z"
          fill="#3B82F6"
        />
        <path
          d="M9.06409 7.4858L0.9375 4.56489L1.34659 3.42352L9.06818 6.19716L17.1927 3.34375L17.5957 4.4892L9.06409 7.4858Z"
          fill="#3B82F6"
        />
      </g>
      <defs>
        <clipPath id="clip0_196_1198">
          <rect
            width="17.0039"
            height="12.1418"
            fill="white"
            transform="translate(0.589844 0.856445)"
          />
        </clipPath>
      </defs>
    </svg>
  )
})
