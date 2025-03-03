import React, { useCallback, useEffect } from 'react'
import { useNodesState, useEdgesState } from '@xyflow/react'
import { stratify, tree } from 'd3-hierarchy'
import type {
  AutomationStepEdge,
  AutomationStepNode,
} from '@/pages/w/engage/flows/@uuid/composer/types/flow_composer_types.js'

export interface UseReactFlowNodesProps {
  initialNodes?: AutomationStepNode[]
  initialEdges?: AutomationStepEdge[]
}

const g = tree<AutomationStepNode>()

export const getLayoutedElements = (
  nodes: AutomationStepNode[],
  edges: AutomationStepEdge[],
) => {
  if (nodes.length === 0) {
    return { nodes, edges }
  }

  const firstNode = window.document?.querySelector(`[data-id="${nodes[0].id}"]`)

  if (!firstNode) {
    return { nodes, edges }
  }

  const { width, height } = firstNode.getBoundingClientRect()
  const hierarchy = stratify<AutomationStepNode>()
    .id((node) => node.id)
    .parentId((node) => edges.find((edge) => edge.target === node.id)?.source)
  const root = hierarchy(nodes)

  const minSpacing = 200

  const layout = g.nodeSize([
    Math.max(width * 2, minSpacing),
    Math.max(height * 2, minSpacing),
  ])(root)

  return {
    nodes: layout
      .descendants()
      .map((node) => ({ ...node.data, position: { x: node.x, y: node.y } })),
    edges,
  }
}
export function useReactFlowNodes({
  initialNodes = [],
  initialEdges = [],
}: UseReactFlowNodesProps = {}) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // biome-ignore lint/correctness/useExhaustiveDependencies: We only need this to execute once, when the component renders and we receive initial props
  React.useEffect(() => {
    const layoutedNodesAndEdges = getLayoutedElements(nodes, edges)
    setNodes(layoutedNodesAndEdges.nodes)
    setEdges(layoutedNodesAndEdges.edges)
  }, [setNodes, setEdges])

  const refreshLayoutedElements = useCallback(() => {
    const layoutedNodesAndEdges = getLayoutedElements(nodes, edges)
    setNodes(layoutedNodesAndEdges.nodes)
    setEdges(layoutedNodesAndEdges.edges)
  }, [nodes, edges, setNodes, setEdges])

  return {
    nodes,
    setNodes,
    onNodesChange,
    edges,
    setEdges,
    onEdgesChange,
    refreshLayoutedElements,
  }
}
