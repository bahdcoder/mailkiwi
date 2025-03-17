import { PlusIcon } from '@/pages/components/icons/plus.svg.jsx'
import { getLayoutedElements } from '@/pages/w/engage/flows/@uuid/composer/hooks/use_react_flow_nodes.js'
import type {
  AutomationStepEdge,
  AutomationStepNode,
} from '@/pages/w/engage/flows/@uuid/composer/types/flow_composer_types.js'
import { Button } from '@kibamail/owly/button'
import {
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
  getStraightPath,
  useReactFlow,
} from '@xyflow/react'

export function AddFlowActionEdge({ id, sourceX, sourceY, targetX, targetY }: EdgeProps) {
  const { setNodes, setEdges, getNode, getNodes, getEdges } = useReactFlow()
  const [, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  })

  const centerY = (targetY - sourceY) / 2 + sourceY

  const edgePath = `M ${sourceX} ${sourceY} L ${sourceX} ${centerY} L ${targetX} ${centerY} L ${targetX} ${targetY}`

  function insertNodeAtEdgePosition() {
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
    const position = {
      x: (sourceNode.position.x + targetNode.position.x) / 2,
      y: (sourceNode.position.y + targetNode.position.y) / 2,
    }

    // Create new node
    const newNode: AutomationStepNode = {
      id: newNodeId,
      position,
      data: {
        id: newNodeId,
        label: `New Action - ${newNodeId}`,
        type: 'ACTION',
        subtype: 'ACTION_REMOVE_TAG',
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
        data: currentEdge.data, // Preserve the original edge's data including position
      },
      {
        id: `${newNodeId}-${currentEdge.target}`,
        source: newNodeId,
        target: currentEdge.target,
        type: 'default',
        data: currentEdge.data, // Preserve the original edge's data including position
      },
    ] as AutomationStepEdge[]

    // Calculate final layout with all changes
    const currentNodes = getNodes() as AutomationStepNode[]
    const layoutedElements = getLayoutedElements([...currentNodes, newNode], updatedEdges)

    const newNodes = layoutedElements.nodes.sort((nodeA, nodeB) =>
      nodeA.id > nodeB.id ? 1 : -1,
    )

    setNodes(newNodes)
    setEdges(layoutedElements.edges)
  }

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
            onClick={insertNodeAtEdgePosition}
            className="kb-background-info border-[var(--black-5)] rounded-lg w-7 h-7 p-0 flex items-center justify-center"
            style={{ pointerEvents: 'all' }}
          >
            <PlusIcon />
          </Button>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
