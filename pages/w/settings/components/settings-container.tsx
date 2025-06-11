import { Heading } from '@kibamail/owly/heading'
import { Text } from '@kibamail/owly/text'
import type { PropsWithChildren, ReactNode } from 'react'
import cn from 'classnames'

interface SettingsContainerProps {
  title: string
  description: string
  actions?: ReactNode
}

export function SettingsContainer({
  title,
  actions,
  children,
  description,
}: PropsWithChildren<SettingsContainerProps>) {
  return (
    <div className="w-full flex flex-col max-w-2xl mx-auto py-12">
      <div
        className={cn('flex flex-col gap-1 border-b kb-border-tertiary', {
          'pb-8': !actions,
          'pb-4': actions,
        })}
      >
        <Heading>{title}</Heading>

        <Text className="kb-content-tertiary">{description}</Text>

        {actions ? (
          <div className="mt-4 gap-4 flex items-center justify-start">{actions}</div>
        ) : null}
      </div>

      <div className="mt-12">{children}</div>
    </div>
  )
}
