import React from "react"

interface StepsRendererProps {
  current: number
  steps: Record<number, React.FC>
}

export function StepsRenderer({ steps, current }: StepsRendererProps) {
  const Step = steps[current]

  return <Step />
}
