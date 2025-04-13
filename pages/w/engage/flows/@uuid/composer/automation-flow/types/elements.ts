import { AutomationStep } from "@/database/database_schema_types.js"
import { Node, Edge } from "react-flow-renderer"

export type NodeElement = Node<{
  onDeleteNodeCallback: (id: string) => void
  onNodeClickCallback: (id: string) => void
  step: AutomationStep
}> & {
  source?: string | undefined
  target?: string | undefined
}

export type EdgeElement = Edge<{
  onAddNodeCallback: () => void
  sourceStep: AutomationStep
  targetSteps: AutomationStep[]
}> & {
  position: {
    x: number
    y: number
  }
}

export type AutomationElement = NodeElement | EdgeElement
