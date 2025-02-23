import {
  Checkbox as CheckboxPrimitive,
  type CheckboxProps,
} from '@kibamail/owly/checkbox'
import { Text, type TextProps } from '@kibamail/owly/text'
import { createContext } from '@radix-ui/react-context'
import React from 'react'

const [CheckboxFieldProvider, useCheckboxFieldContext] = createContext<{
  baseId: string
}>('CheckboxField')

function CheckboxFieldRoot({ children, ...checkboxProps }: CheckboxProps) {
  const baseId = React.useId()

  return (
    <CheckboxFieldProvider baseId={baseId}>
      <div className="grid grid-cols-[auto_1fr] gap-2">
        <CheckboxPrimitive
          {...checkboxProps}
          aria-describedby={makeDescriptionId(baseId)}
        />
        <div className="flex flex-col gap-y-1">{children}</div>
      </div>
    </CheckboxFieldProvider>
  )
}

function CheckboxFieldLabel({
  children,
  ...labelProps
}: React.PropsWithChildren<React.ComponentPropsWithoutRef<'label'>>) {
  const { baseId } = useCheckboxFieldContext('CheckboxFieldLabel')

  return (
    <Text {...labelProps} as="label" className="kb-content-secondary font-medium">
      {children}
    </Text>
  )
}

function CheckboxFieldDescription({ children }: React.PropsWithChildren<TextProps>) {
  const { baseId, ...textProps } = useCheckboxFieldContext('CheckboxFieldLabel')

  return (
    <Text
      {...textProps}
      className="kb-content-tertiary"
      id={makeDescriptionId(baseId)}
      as="span"
    >
      {children}
    </Text>
  )
}

function makeDescriptionId(baseId: string) {
  return `${baseId}-description`
}

export {
  CheckboxFieldRoot as Root,
  CheckboxFieldLabel as Label,
  CheckboxFieldDescription as Description,
}
