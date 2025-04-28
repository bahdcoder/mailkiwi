import React from 'react'
import { Automation } from './automation.jsx'
import './styles.css'
import type {
  AutomationElement,
  EdgeElement,
} from '@/pages/w/engage/flows/@uuid/composer/automation-flow/types/elements.js'
import type { NodeElement } from './types/elements.js'

import type {
  AutomationStep,
  AutomationWithSteps,
} from '@/database/database_schema_types.js'
import { usePageContextWithProps, usePageProps } from '@/pages/hooks/use_page_props.js'
import { AddNodeDialog } from './components/add-node-dialog.jsx'

function generateNodesAndEdgesFromAutomationSteps(
  steps: AutomationStep[],
  selectedNode: NodeElement | null,
  callbacks: {
    onDeleteNodeCallback: (id: string) => void
    onNodeClickCallback: (id: string) => void
    onAddNodeCallback: (id: string) => void
  },
): AutomationElement[] {
  // Create a map of steps by ID for faster lookup
  const stepsMap = new Map<string, AutomationStep>()
  for (const step of steps) {
    stepsMap.set(step.id, step)
  }

  // Create nodes for each step
  const nodes: NodeElement[] = steps.map((step) => ({
    id: step.id,
    type: step.subtype,
    data: {
      step,
      selected: selectedNode ? selectedNode.id === step.id : false,
      onDeleteNodeCallback: callbacks.onDeleteNodeCallback,
      onNodeClickCallback: callbacks.onNodeClickCallback,
    },
    position: { x: 0, y: 0 },
    style: {
      width: 300,
      height: 104,
    },
  }))

  const edges: EdgeElement[] = []

  // Helper function to create an edge between two steps
  const createEdge = (
    sourceStep: AutomationStep,
    targetStep: AutomationStep,
    branch?: string,
  ): EdgeElement => {
    const branchSuffix = branch ? `-${branch}` : ''
    return {
      id: `${sourceStep.id}-${targetStep.id}${branchSuffix}`,
      source: sourceStep.id,
      target: targetStep.id,
      data: {
        onAddNodeCallback: callbacks.onAddNodeCallback,
        sourceStep,
        targetSteps: [targetStep],
      },
    }
  }

  // Find the trigger step (the one with no parentId)
  const triggerStep = steps.find((step) => !step.parentId)
  if (!triggerStep) return nodes // If no trigger step, just return nodes without edges

  // Create parent-child edges
  for (const step of steps) {
    // Skip the trigger step as it has no parent
    if (!step.parentId) continue

    // Find the parent step
    const parentStep = stepsMap.get(step.parentId)
    if (!parentStep) {
      console.warn(`Parent step ${step.parentId} not found for step ${step.id}`)
      continue
    }

    // Create the appropriate edge based on the parent type and branch index
    if (parentStep.subtype === 'RULE_IF_ELSE') {
      // For IF/ELSE rules, create YES/NO branch edges
      const branch =
        step.branchIndex === 0 ? 'YES' : step.branchIndex === 1 ? 'NO' : undefined
      edges.push(createEdge(parentStep, step, branch))
    } else {
      // For other node types, create a standard edge
      edges.push(createEdge(parentStep, step))
    }
  }

  // Return both nodes and edges
  return [...nodes, ...edges]
}

export const Flow = () => {
  const {
    pageProps: { automation },
  } = usePageContextWithProps<{ automation: AutomationWithSteps }>()

  const [automationSteps] = React.useState<AutomationStep[]>(automation.steps)

  const [addNodeDialogOpen, setAddNodeDialogOpen] = React.useState(false)
  const [selectedNode, setSelectedNode] = React.useState<NodeElement | null>(null)

  const [selectedEdge, setSelectedEdge] = React.useState<EdgeElement | null>(null)

  const onAddNodeCallback = (id: string) => {
    const edge = elements.find((element) => element.id === id)

    if (!edge) {
      return
    }

    setSelectedEdge(edge as EdgeElement)
    setAddNodeDialogOpen(true)
  }

  const onDeleteNodeCallback = (id: string) => {}

  const onNodeClickCallback = (id: string) => {
    const currentSelectedNode =
      (elements.find((element) => element.id === id) as NodeElement) || null
    setSelectedNode(currentSelectedNode)
    setElements(
      generateNodesAndEdgesFromAutomationSteps(automationSteps, currentSelectedNode, {
        onAddNodeCallback,
        onDeleteNodeCallback,
        onNodeClickCallback,
      }),
    )
  }

  const onAddNodeSuccess = (automation: AutomationWithSteps) => {
    setSelectedEdge(null)
    setAddNodeDialogOpen(false)
    setElements(
      generateNodesAndEdgesFromAutomationSteps(automation.steps, selectedNode, {
        onAddNodeCallback,
        onDeleteNodeCallback,
        onNodeClickCallback,
      }),
    )
  }

  const [elements, setElements] = React.useState<AutomationElement[]>(
    generateNodesAndEdgesFromAutomationSteps(automationSteps, selectedNode, {
      onAddNodeCallback,
      onDeleteNodeCallback,
      onNodeClickCallback,
    }),
  )

  return (
    <div className="h-screen fleelement items-center w-full justify-center">
      <Automation elements={elements} />
      <AddNodeDialog
        edge={selectedEdge}
        open={addNodeDialogOpen}
        setOpen={setAddNodeDialogOpen}
        allowedTypes={['ACTIONS', 'RULES']}
        onAddNodeSuccess={onAddNodeSuccess}
      />
    </div>
  )
}
