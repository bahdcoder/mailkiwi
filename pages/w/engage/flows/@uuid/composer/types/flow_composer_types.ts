import type { AutomationStep } from '@/database/database_schema_types.js'
import type { Node, Edge, NodePositionChange } from '@xyflow/react'

export type AutomationStepNodeType = {
  id: string
  label: string
  type: AutomationStep['type']
  subtype: AutomationStep['subtype']
}

export type AutomationStepNode = Node<AutomationStepNodeType>

export type AutomationStepEdge = Edge<{
  position?: 'left' | 'right'
}>
