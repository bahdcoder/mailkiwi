import { Text } from '@kibamail/owly/text'
import React from 'react'

export interface MetricCardProps {
  rate: {
    label: string
    value?: string
  }
  value: {
    value?: string
    label: string
  }
}

export function MetricCard({ rate, value }: MetricCardProps) {
  return (
    <div className="flex flex-col gap-2">
      <Text className="kb-content-tertiary">{value.label}</Text>

      <Text className="kb-content-secondary text-2xl font-semibold">{value.value}</Text>

      <div className="flex items-center gap-2">
        <Text className="kb-content-tertiary shrink-0">{rate.label}</Text>

        <div className=" w-full grow flex items-center">
          <div className="h-px w-full bg-(--border-tertiary)" />
        </div>

        <Text className="kb-content-secondary">{rate.value}</Text>
      </div>
    </div>
  )
}
