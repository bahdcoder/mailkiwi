import { CheckCircleIcon } from '#root/pages/components/icons/check-circle.svg.jsx'
import { EyeClosedIcon } from '#root/pages/components/icons/eye-closed.svg.jsx'
import { EyeIcon } from '#root/pages/components/icons/eye.svg.jsx'
import { XMarkCircleIcon } from '#root/pages/components/icons/x-mark-circle.svg.jsx'
import { usePasswordStrengthIndicator } from '#root/pages/components/input/hooks/use-password-strength-indicator.js'
import { Progress } from '@kibamail/owly/progress'
import * as TextField from '@kibamail/owly/text-field'
import { composeRefs } from '@radix-ui/react-compose-refs'
import cn from 'classnames'
import React, { useEffect } from 'react'

export interface PasswordFieldProps
  extends React.ComponentPropsWithoutRef<typeof TextField.Root> {
  strengthIndicator?: boolean
}

export const PasswordField = React.forwardRef<
  React.ElementRef<typeof TextField.Root>,
  PasswordFieldProps
>((props, forwardedRef) => {
  const { strengthIndicator, children, ...textFieldProps } = props
  const passwordFieldRef = React.useRef<HTMLInputElement>(null)
  const [visible, setVisible] = React.useState(false)

  const { indicator, validationRulesResults, rules, onChange } =
    usePasswordStrengthIndicator(strengthIndicator)

  function onTogglePasswordVisibilityClick(_event: React.MouseEvent<HTMLButtonElement>) {
    const field = passwordFieldRef.current

    if (!field) {
      return
    }

    requestAnimationFrame(() => {
      try {
        field.setSelectionRange(field.value.length, field.value.length)
      } catch (error) {}
      field.focus()
    })

    setVisible((current) => !current)
  }

  function onInput(_event: React.FormEvent<HTMLInputElement>) {
    if (!strengthIndicator) {
      return
    }

    const password = passwordFieldRef.current?.value ?? ''
    onChange(password)
  }

  const allChildren = React.Children.toArray(children)

  const Label = allChildren.find(
    (child) => React.isValidElement(child) && child.type === TextField.Label,
  )

  const hasError = allChildren.some(
    (child) => React.isValidElement(child) && child.type === TextField.Error,
  )

  const textFieldChildren = allChildren.filter(
    (child) => React.isValidElement(child) && child.type !== TextField.Label,
  )

  return (
    <>
      <TextField.Root
        id="password"
        ref={composeRefs(passwordFieldRef, forwardedRef)}
        placeholder="Enter password"
        {...textFieldProps}
        onInput={onInput}
        type={visible ? 'text' : 'password'}
      >
        {Label ? Label : <TextField.Label htmlFor="password">Password</TextField.Label>}

        <TextField.Slot side="right">
          <button
            type="button"
            className="kb-reset focus:outline-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-(--border-focus) rounded-sm"
            aria-label={`${visible ? 'Hide' : 'Show'} password`}
            onClick={onTogglePasswordVisibilityClick}
          >
            {visible ? <EyeClosedIcon aria-hidden /> : <EyeIcon aria-hidden />}
          </button>
        </TextField.Slot>

        {strengthIndicator
          ? rules.map((rule, idx) => {
              const passed = validationRulesResults[idx]

              return (
                <TextField.Hint
                  key={`password-rule-${rule.message}`}
                  className={cn({
                    'mt-8': idx === 0 && !hasError,
                    'kb-content-positive': passed,
                  })}
                >
                  <TextField.HintIcon>
                    {passed ? <CheckCircleIcon /> : <XMarkCircleIcon />}
                  </TextField.HintIcon>
                  {rule.message}
                </TextField.Hint>
              )
            })
          : null}
        {textFieldChildren}
      </TextField.Root>

      {strengthIndicator ? (
        <div className="absolute top-18 w-full">
          <Progress
            variant={indicator.variant}
            value={indicator.percentage}
            aria-hidden
          />
        </div>
      ) : null}
    </>
  )
})
