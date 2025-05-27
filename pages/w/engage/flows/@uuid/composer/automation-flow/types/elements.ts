import type { AutomationStep } from '#root/database/database_schema_types.js'
import type { Edge, Node } from 'react-flow-renderer'

export type NodeElement = Node<{
  onDeleteNodeCallback: (id: string) => void
  onNodeClickCallback: (id: string) => void
  step: AutomationStep
  selected: boolean
}> & {
  source?: string | undefined
  target?: string | undefined
}

export type EdgeElement = Edge<{
  onAddNodeCallback: (id: string) => void
  sourceStep: AutomationStep
  targetSteps: AutomationStep[]
}>

export type AutomationElement = NodeElement | EdgeElement
