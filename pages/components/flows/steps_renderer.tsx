import type React from 'react'

interface StepsRendererProps {
  current: number
  steps: Record<
    number,
    | React.FC<Record<string, unknown>>
    | React.ComponentType<{
        fallback?: React.ReactNode
      }>
  >
}

export function StepsRenderer({ steps, current }: StepsRendererProps) {
  const Step = steps[current]

  if (!Step) {
    return null
  }

  return <Step />
}
