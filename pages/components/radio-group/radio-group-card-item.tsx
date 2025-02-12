import { Checkbox } from "@kibamail/owly/checkbox"
import { Heading } from "@kibamail/owly/heading"
import { Text } from "@kibamail/owly/text"
import * as RadioGroup from "@radix-ui/react-radio-group"
import cn from "classnames"
import React from "react"

export interface RadioGroupCardItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  title?: string
  description?: string
  checked?: boolean
}

export function RadioGroupCardItem({
  checked,
  title,
  description,
  children,
  disabled,
  ...props
}: RadioGroupCardItemProps) {
  return (
    <button
      className={cn("w-full flex items-start gap-2 p-4 rounded-xl border", {
        "kb-border-info kb-background-secondary": checked,
        "kb-border-tertiary": !checked,
      })}
      disabled={disabled}
      {...props}
    >
      <Checkbox variant="circle" checked={checked} disabled={disabled} />
      <div className="flex flex-col gap-1 -mt-1 flex-grow">
        <Heading
          size="xs"
          className={cn("text-left", {
            "kb-content-disabled": disabled,
          })}
        >
          {title}
        </Heading>
        <Text
          className={cn("text-left", {
            "kb-content-disabled": disabled,
            "kb-content-tertiary": !disabled,
          })}
        >
          {description}
        </Text>
        {checked ? children : null}
      </div>
    </button>
  )
}
