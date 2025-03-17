import React, { useCallback, useEffect } from 'react'
import { useNodesState, useEdgesState } from '@xyflow/react'
import type {
  AutomationStepEdge,
  AutomationStepNode,
} from '@/pages/w/engage/flows/@uuid/composer/types/flow_composer_types.js'

export interface UseReactFlowNodesProps {
  initialNodes?: AutomationStepNode[]
  initialEdges?: AutomationStepEdge[]
}

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

  // Create a map to store node positions
  const nodePositions = new Map<string, { x: number; y: number }>()

  // Create a map to track children on left and right sides for each node
  const nodeChildrenMap = new Map<
    string,
    { left: string[]; right: string[]; other: string[] }
  >()

  for (const node of nodes) {
    nodeChildrenMap.set(node.id, { left: [], right: [], other: [] })
  }

  // Categorize children based on edge position
  for (const edge of edges) {
    const sourceId = edge.source
    const targetId = edge.target
    const position = edge.data?.position

    const childrenMap = nodeChildrenMap.get(sourceId)
    if (childrenMap) {
      if (position === 'left') {
        childrenMap.left.push(targetId)
      } else if (position === 'right') {
        childrenMap.right.push(targetId)
      } else {
        childrenMap.other.push(targetId)
      }
    }
  }

  // Find the root node (node with no incoming edges)
  const rootNodeId =
    nodes.find((node) => !edges.some((edge) => edge.target === node.id))?.id ||
    nodes[0].id

  // Set position for root node
  const rootX = 0
  const rootY = 0
  nodePositions.set(rootNodeId, { x: rootX, y: rootY })

  // Calculate appropriate spacing
  const horizontalSpacing = Math.max(width * 2, 200)
  const verticalSpacing = Math.max(height * 2, 150)

  // Position all nodes in the tree
  positionNodesInTree(rootNodeId, rootX, rootY, horizontalSpacing, verticalSpacing)

  // Function to position nodes in a tree structure
  function positionNodesInTree(
    nodeId: string,
    x: number,
    y: number,
    horizontalSpacing: number,
    verticalSpacing: number,
  ) {
    const childrenMap = nodeChildrenMap.get(nodeId)
    if (!childrenMap) return

    const nextY = y + verticalSpacing

    // Count total children
    const totalChildren =
      childrenMap.left.length + childrenMap.right.length + childrenMap.other.length

    // If there's only one child total, keep it in a vertical line
    if (totalChildren === 1) {
      let childId: string | undefined

      if (childrenMap.left.length === 1) {
        childId = childrenMap.left[0]
      } else if (childrenMap.right.length === 1) {
        childId = childrenMap.right[0]
      } else if (childrenMap.other.length === 1) {
        childId = childrenMap.other[0]
      }

      if (childId) {
        // Position the single child directly below its parent
        nodePositions.set(childId, { x, y: nextY })
        positionNodesInTree(childId, x, nextY, horizontalSpacing, verticalSpacing)
        return
      }
    }

    // Handle branching nodes (nodes with multiple children)

    // Position left children
    if (childrenMap.left.length > 0) {
      // Calculate starting position for left children
      let leftX = x - horizontalSpacing

      // If there's only one left child, position it directly to the left
      if (childrenMap.left.length === 1) {
        const childId = childrenMap.left[0]
        nodePositions.set(childId, { x: leftX, y: nextY })
        positionNodesInTree(childId, leftX, nextY, horizontalSpacing, verticalSpacing)
      } else {
        // Multiple left children, distribute them
        for (const childId of childrenMap.left) {
          nodePositions.set(childId, { x: leftX, y: nextY })
          positionNodesInTree(childId, leftX, nextY, horizontalSpacing, verticalSpacing)
          leftX -= horizontalSpacing
        }
      }
    }

    // Position right children
    if (childrenMap.right.length > 0) {
      // Calculate starting position for right children
      let rightX = x + horizontalSpacing

      // If there's only one right child, position it directly to the right
      if (childrenMap.right.length === 1) {
        const childId = childrenMap.right[0]
        nodePositions.set(childId, { x: rightX, y: nextY })
        positionNodesInTree(childId, rightX, nextY, horizontalSpacing, verticalSpacing)
      } else {
        // Multiple right children, distribute them
        for (const childId of childrenMap.right) {
          nodePositions.set(childId, { x: rightX, y: nextY })
          positionNodesInTree(childId, rightX, nextY, horizontalSpacing, verticalSpacing)
          rightX += horizontalSpacing
        }
      }
    }

    // Position other children (those without a specific position)
    if (childrenMap.other.length > 0) {
      // If there's only one other child and no left/right children, position it directly below
      if (
        childrenMap.other.length === 1 &&
        childrenMap.left.length === 0 &&
        childrenMap.right.length === 0
      ) {
        const childId = childrenMap.other[0]
        nodePositions.set(childId, { x, y: nextY })
        positionNodesInTree(childId, x, nextY, horizontalSpacing, verticalSpacing)
      } else {
        // Multiple other children or there are also left/right children, distribute them evenly
        const startX = x - ((childrenMap.other.length - 1) * horizontalSpacing) / 2

        childrenMap.other.forEach((childId, index) => {
          const childX = startX + index * horizontalSpacing
          nodePositions.set(childId, { x: childX, y: nextY })
          positionNodesInTree(childId, childX, nextY, horizontalSpacing, verticalSpacing)
        })
      }
    }
  }

  // Apply calculated positions to nodes
  const updatedNodes = nodes.map((node) => {
    const position = nodePositions.get(node.id)
    if (position) {
      return { ...node, position }
    }
    return node
  })

  return { nodes: updatedNodes, edges }
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
