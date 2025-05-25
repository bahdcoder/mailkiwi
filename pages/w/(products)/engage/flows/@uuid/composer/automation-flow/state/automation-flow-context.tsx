import type {
  AutomationStep,
  AutomationWithSteps,
} from '#root/database/database_schema_types.js'
import { usePageContextWithProps } from '#root/pages/hooks/use_page_props.js'
import { createContext } from '@radix-ui/react-context'
import React, { type PropsWithChildren } from 'react'
import type { EdgeElement, NodeElement } from '../types/elements.js'

export interface AutomationFlowContextState {
  automationSteps: AutomationStep[]
  selectedNode: NodeElement | null
  selectedEdge: EdgeElement | null
  addNodeDialogOpen: boolean
  setAddNodeDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
  setSelectedNode: React.Dispatch<React.SetStateAction<NodeElement | null>>
  setSelectedEdge: React.Dispatch<React.SetStateAction<EdgeElement | null>>
}

const [AutomationFlowContextProvider, useAutomationFlowContext] =
  createContext<AutomationFlowContextState>('AutomationFlowBuilder', {
    automationSteps: [] as AutomationStep[],
    selectedNode: null,
    selectedEdge: null,
    addNodeDialogOpen: false,
    setAddNodeDialogOpen: () => {},
    setSelectedNode: () => {},
    setSelectedEdge: () => {},
  })

export function AutomationFlowProvider({ children }: PropsWithChildren) {
  const {
    pageProps: { automation },
  } = usePageContextWithProps<{ automation: AutomationWithSteps }>()

  const [automationSteps] = React.useState<AutomationStep[]>(automation.steps)

  const [addNodeDialogOpen, setAddNodeDialogOpen] = React.useState(false)
  const [selectedNode, setSelectedNode] = React.useState<NodeElement | null>(null)

  const [selectedEdge, setSelectedEdge] = React.useState<EdgeElement | null>(null)

  return (
    <AutomationFlowContextProvider
      automationSteps={automationSteps}
      selectedNode={selectedNode}
      selectedEdge={selectedEdge}
      addNodeDialogOpen={addNodeDialogOpen}
      setAddNodeDialogOpen={setAddNodeDialogOpen}
      setSelectedNode={setSelectedNode}
      setSelectedEdge={setSelectedEdge}
    >
      {children}
    </AutomationFlowContextProvider>
  )
}

export function useAutomationFlowBuilder() {
  return useAutomationFlowContext('AutomationFlowBuilder')
}
