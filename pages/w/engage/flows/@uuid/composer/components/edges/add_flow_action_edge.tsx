import { PlusIcon } from '@/pages/components/icons/plus.svg.jsx'
import { getLayoutedElements } from '@/pages/w/engage/flows/@uuid/composer/hooks/use_react_flow_nodes.js'
import type {
  AutomationStepEdge,
  AutomationStepNode,
  AutomationStepNodeType,
} from '@/pages/w/engage/flows/@uuid/composer/types/flow_composer_types.js'
import { automationNodeTypes } from '@/pages/w/engage/flows/@uuid/composer/components/nodes/index.js'
import { Button } from '@kibamail/owly/button'
import * as Dialog from '@kibamail/owly/dialog'
import {
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
  getStraightPath,
  useReactFlow,
} from '@xyflow/react'
import { useState } from 'react'

export function AddFlowActionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  source,
  target,
}: EdgeProps) {
  const { setNodes, setEdges, getNode, getNodes, getEdges } = useReactFlow()
  const [, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const centerY = (targetY - sourceY) / 2 + sourceY

  // Get source and target nodes to check their types
  const sourceNode = getNode(source)
  const targetNode = getNode(target)

  // Determine if this is an edge from a trigger node
  const isTriggerSource = sourceNode?.type === 'trigger'

  // Adjust offsets based on node types
  let sourceYOffset = 2
  let targetYOffset = 2

  // Custom adjustments for specific node types
  if (isTriggerSource) {
    sourceYOffset = 5
  }

  if (targetNode?.type === 'if_else') {
    targetYOffset = 5
  }

  // Apply offsets
  const sourceYWithOffset = sourceY + sourceYOffset
  const targetYWithOffset = targetY - targetYOffset

  // Create a custom path for trigger node connections
  const edgePath = `M ${sourceX} ${sourceYWithOffset} L ${sourceX} ${centerY} L ${targetX} ${centerY} L ${targetX} ${targetYWithOffset}`

  // // Special handling for trigger node edges
  // if (isTriggerSource) {
  //   // Use a straight vertical path for trigger nodes to ensure alignment
  //   // This ensures the connection appears straight even if there are minor x-coordinate differences
  //   edgePath = `M ${sourceX} ${sourceYWithOffset} L ${sourceX} ${(sourceYWithOffset + targetYWithOffset) / 2} L ${targetX} ${(sourceYWithOffset + targetYWithOffset) / 2} L ${targetX} ${targetYWithOffset}`

  //   // If source and target X are very close (within a small threshold), force perfect alignment
  //   if (Math.abs(sourceX - targetX) < 5) {
  //     // Use the average X position to ensure perfect vertical alignment
  //     const alignedX = (sourceX + targetX) / 2
  //     edgePath = `M ${alignedX} ${sourceYWithOffset} L ${alignedX} ${targetYWithOffset}`
  //   }
  // }

  function insertNodeAtEdgePosition(nodeType: string) {
    const nodes = getNodes()
    const newNodeId = nodes.length.toString()

    // Get all current state
    const edges = getEdges()
    const currentEdge = edges.find((e) => e.id === id)
    if (!currentEdge) return

    // Get source and target nodes
    const sourceNode = getNode(currentEdge.source)
    const targetNode = getNode(currentEdge.target)

    if (!sourceNode || !targetNode) return

    // Calculate position based on source and target nodes
    // Use the exact midpoint of the edge for more stable positioning
    const position = {
      x: (sourceX + targetX) / 2,
      y: (sourceY + targetY) / 2,
    }

    // Create new node with the selected type
    const newNode: AutomationStepNode = {
      id: newNodeId,
      position,
      type: nodeType, // Use the selected node type
      data: {
        id: newNodeId,
        label: `New ${nodeType.replace(/_/g, ' ')} - ${newNodeId}`,
        type: nodeType.includes('trigger')
          ? 'TRIGGER'
          : nodeType.includes('rule')
            ? 'RULE'
            : 'ACTION',
        subtype: `${nodeType.toUpperCase()}` as AutomationStepNodeType['subtype'],
      },
      draggable: false,
    }

    // Create new edges with deterministic IDs
    const newEdges = edges.filter((e) => e.id !== id)
    const updatedEdges = [
      ...newEdges,
      {
        id: `${currentEdge.source}-${newNodeId}`,
        source: currentEdge.source,
        target: newNodeId,
        type: 'default',
        data: {
          ...currentEdge.data,
          // Ensure position data is preserved
          position: 'bottom',
        },
      },
      {
        id: `${newNodeId}-${currentEdge.target}`,
        source: newNodeId,
        target: currentEdge.target,
        type: 'default',
        data: {
          ...currentEdge.data,
          // Ensure position data is preserved
          position: 'bottom',
        },
      },
    ] as AutomationStepEdge[]

    // First add the node without layout calculation
    const currentNodes = getNodes() as AutomationStepNode[]

    // Create a single layout calculation with all elements
    const layoutedElements = getLayoutedElements([...currentNodes, newNode], updatedEdges)

    // Apply the layout in a single update to prevent flickering
    setNodes([...layoutedElements.nodes].sort((nodeA, nodeB) => nodeA.id > nodeB.id ? 1 : -1))
    setEdges(layoutedElements.edges)
    setIsDialogOpen(false)
  }

  // Get all available node types from automationNodeTypes
  const nodeTypeOptions = Object.keys(automationNodeTypes).map((key) => ({
    id: key,
    label: key
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '),
  }))

  // Group node types by category
  const ruleNodes = nodeTypeOptions.filter(
    (node) =>
      node.id.includes('rule') ||
      node.id === 'if_else' ||
      node.id === 'time_delay' ||
      node.id === 'percentage_split',
  )
  const actionNodes = nodeTypeOptions.filter(
    (node) =>
      node.id.includes('action') ||
      node.id === 'tag_untag' ||
      node.id === 'send_email' ||
      node.id === 'unsubscribe' ||
      node.id === 'send_webhook' ||
      node.id === 'update_contact',
  )
  const triggerNodes = nodeTypeOptions.filter(
    (node) =>
      node.id.includes('trigger') || node.id === 'flow_end' || node.id === 'placeholder',
  )

  return (
    <>
      <BaseEdge id={id} path={edgePath} />
      <EdgeLabelRenderer>
        <div
          style={{
            pointerEvents: 'all',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          }}
          className="absolute min-h-6 min-w-6 flex items-center justify-center p-0.5 bg-[var(--background-secondary)]"
        >
          <Button
            variant="primary"
            onClick={() => setIsDialogOpen(true)}
            className="kb-background-info border-[var(--black-5)] rounded-lg w-7 h-7 p-0 flex items-center justify-center"
            style={{ pointerEvents: 'all' }}
          >
            <PlusIcon />
          </Button>
        </div>
      </EdgeLabelRenderer>

      <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>Select Node Type</Dialog.Title>
            <Dialog.Description>
              Choose a node type to insert at this position
            </Dialog.Description>
          </Dialog.Header>

          <div className="p-4 flex flex-col gap-4">
            {ruleNodes.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Rules</h3>
                <div className="grid grid-cols-2 gap-2">
                  {ruleNodes.map((node) => (
                    <Button
                      key={node.id}
                      variant="tertiary"
                      onClick={() => insertNodeAtEdgePosition(node.id)}
                      className="justify-start text-left"
                    >
                      {node.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {actionNodes.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                  {actionNodes.map((node) => (
                    <Button
                      key={node.id}
                      variant="tertiary"
                      onClick={() => insertNodeAtEdgePosition(node.id)}
                      className="justify-start text-left"
                    >
                      {node.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {triggerNodes.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Triggers</h3>
                <div className="grid grid-cols-2 gap-2">
                  {triggerNodes.map((node) => (
                    <Button
                      key={node.id}
                      variant="tertiary"
                      onClick={() => insertNodeAtEdgePosition(node.id)}
                      className="justify-start text-left"
                    >
                      {node.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Dialog.Footer className="flex justify-end">
            <Dialog.Close asChild>
              <Button variant="tertiary">Cancel</Button>
            </Dialog.Close>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Root>
    </>
  )
}
