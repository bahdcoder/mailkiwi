import { Heading } from '@kibamail/owly/heading'
import { Text } from '@kibamail/owly/text'
import type React from 'react'

export interface EmptyStateProps extends React.PropsWithChildren {
  title?: string
  description?: string
}

export function EmptyState({ title, description, children }: EmptyStateProps) {
  return (
    <div className="w-full min-h-96 rounded-3xl kb-background-hover flex justify-center items-center my-6">
      <div className="flex flex-col justify-center items-center">
        <div className="w-20 h-20 rounded-3xl bg-white border kb-border-tertiary mb-4" />

        <Heading size="sm">{title}</Heading>

        <Text className="mt-2 kb-content-tertiary">{description}</Text>

        <div className="mt-6">{children}</div>
      </div>
    </div>
  )
}
