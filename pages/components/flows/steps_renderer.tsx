import React from "react"

interface StepsRendererProps {
  current: number
  steps: Record<
    number,
    | React.FC
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
