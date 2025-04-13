import React from 'react'
import { cloneDeep } from './utils/clone_deep.js'
import { Automation } from './automation.jsx'
import { initialElements } from './data/elements1.js'
import { getParentNodeIdFromTargetEdgeId } from './utils/elements.js'
import 'antd/dist/antd.css'
import './styles.css'
import {
  AutomationElement,
  EdgeElement,
} from '@/pages/w/engage/flows/@uuid/composer/automation-flow/types/elements.js'
import { NodeElement } from './types/elements.js'

import { AddNodeDialog } from './components/add-node-dialog.jsx'
import { AutomationStep, AutomationWithSteps } from '@/database/database_schema_types.js'
import { usePageProps } from '@/pages/hooks/use_page_props.js'

function generateNodesAndEdgesFromAutomationSteps(
  steps: AutomationStep[],
  callbacks: {
    onDeleteNodeCallback: (id: string) => void
    onNodeClickCallback: (id: string) => void
    onAddNodeCallback: (id: string) => void
  },
): AutomationElement[] {
  const nodes: NodeElement[] = steps.map((step) => ({
    id: step.id,
    type: step.subtype,
    data: {
      step,
      onDeleteNodeCallback: callbacks.onDeleteNodeCallback,
      onNodeClickCallback: callbacks.onNodeClickCallback,
    },
    position: { x: 0, y: 0 },
    style: {
      width: 300,
      height: 104,
    },
  }))

  let edges: EdgeElement[] = []
  // Keep track of nodes we've already processed to avoid duplicates
  const processedNodeIds = new Set<string>()

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
      type: 'condition',
    }
  }

  // Find the trigger step (the one with no parentId)
  const triggerStep = steps.find((step) => !step.parentId)
  if (!triggerStep) return nodes // If no trigger step, just return nodes without edges

  // Process a step and its children recursively
  const processStep = (currentStep: AutomationStep) => {
    // Skip if we've already processed this node
    if (processedNodeIds.has(currentStep.id)) return
    processedNodeIds.add(currentStep.id)

    // Find direct children of the current step
    const childSteps = steps.filter((step) => step.parentId === currentStep.id)

    // If this is an if/else rule node, handle the branches
    if (currentStep.subtype === 'RULE_IF_ELSE') {
      // Find the YES branch (branchIndex = 0) and NO branch (branchIndex = 1)
      const yesBranchStep = childSteps.find((step) => step.branchIndex === 0)
      const noBranchStep = childSteps.find((step) => step.branchIndex === 1)

      if (yesBranchStep) {
        // Create edge for YES branch
        edges.push(createEdge(currentStep, yesBranchStep, 'YES'))
        // Process the YES branch recursively
        processStep(yesBranchStep)
      }

      if (noBranchStep) {
        // Create edge for NO branch
        edges.push(createEdge(currentStep, noBranchStep, 'NO'))
        // Process the NO branch recursively
        processStep(noBranchStep)
      }
    }
    // For other node types, just connect to the next step (if any)
    else if (childSteps.length > 0) {
      // For non-branching nodes, there should be only one child
      const nextStep = childSteps[0]
      edges.push(createEdge(currentStep, nextStep))
      // Process the next step recursively
      processStep(nextStep)
    }
    // If no children, this is an end node - no edges to create
  }

  // Start processing from the trigger step
  processStep(triggerStep)

  // Return both nodes and edges
  return [...nodes, ...edges]
}

export const Flow = () => {
  const { automation } = usePageProps<{ automation: AutomationWithSteps }>()

  const [automationSteps, setAutomationSteps] = React.useState<AutomationStep[]>(
    automation.steps,
  )

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
    console.log(`You clicked the "${id}" node`)
  }

  const onAddNodeSuccess = (automation: AutomationWithSteps) => {
    setAutomationSteps(automation.steps)
    setSelectedEdge(null)
    setAddNodeDialogOpen(false)
    setElements(
      generateNodesAndEdgesFromAutomationSteps(automation.steps, {
        onAddNodeCallback,
        onDeleteNodeCallback,
        onNodeClickCallback,
      }),
    )
  }

  const [elements, setElements] = React.useState<AutomationElement[]>(
    generateNodesAndEdgesFromAutomationSteps(automationSteps, {
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
