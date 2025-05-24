import { Checkbox } from '@kibamail/owly/checkbox'
import { Heading } from '@kibamail/owly/heading'
import { Text } from '@kibamail/owly/text'
import * as RadioGroup from '@radix-ui/react-radio-group'
import cn from 'classnames'
import type React from 'react'

export interface RadioGroupCardItemProps
  extends React.HtmlHTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  checked?: boolean
  disabled?: boolean
}

export function RadioGroupCardItem({
  checked,
  title,
  className,
  description,
  children,
  disabled,
  ...props
}: RadioGroupCardItemProps) {
  return (
    <div
      className={cn(
        'w-full flex items-start gap-2 p-4 rounded-xl border',
        {
          'kb-border-info kb-background-secondary': checked,
          'kb-border-tertiary': !checked,
        },
        className,
      )}
      {...props}
    >
      <Checkbox variant="circle" checked={checked} disabled={disabled} />
      <div className="flex flex-col gap-1 -mt-1 grow">
        <Heading
          size="xs"
          className={cn('text-left', {
            'kb-content-disabled': disabled,
          })}
        >
          {title}
        </Heading>
        <Text
          className={cn('text-left', {
            'kb-content-disabled': disabled,
            'kb-content-tertiary': !disabled,
          })}
        >
          {description}
        </Text>
        {checked ? children : null}
      </div>
    </div>
  )
}
