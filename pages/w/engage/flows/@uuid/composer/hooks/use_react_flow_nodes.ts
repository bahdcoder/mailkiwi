import React, { useCallback, useEffect, useState } from 'react'
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

  // Define standard dimensions for different node types
  const nodeDimensions = new Map<string, { width: number; height: number }>()

  // Set default dimensions for all nodes
  const defaultDimensions = { width: 200, height: 100 }

  // Apply dimensions based on node type
  for (const node of nodes) {
    // Try to get dimensions from DOM first (for already rendered nodes)
    const nodeElement = window.document?.querySelector(`[data-id="${node.id}"]`)
    if (nodeElement) {
      const rect = nodeElement.getBoundingClientRect()
      // Only use DOM dimensions if they seem valid (non-zero)
      if (rect.width > 10 && rect.height > 10) {
        nodeDimensions.set(node.id, {
          width: rect.width,
          height: rect.height,
        })
        continue
      }
    }

    // Fallback to type-based dimensions if DOM measurement fails
    switch (node.type) {
      case 'automationTrigger':
        nodeDimensions.set(node.id, { width: 230, height: 80 })
        break
      case 'ifElseRule':
        nodeDimensions.set(node.id, { width: 280, height: 120 })
        break
      case 'sendEmailAction':
        nodeDimensions.set(node.id, { width: 250, height: 100 })
        break
      default:
        // For any other node type, use the default dimensions
        nodeDimensions.set(node.id, { ...defaultDimensions })
    }
  }

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

  // Set position for root node - center it horizontally
  const rootX = 0
  const rootY = 0
  nodePositions.set(rootNodeId, { x: rootX, y: rootY })

  // Position all nodes in the tree
  positionNodesInTree(rootNodeId, rootX, rootY)

  // Function to position nodes in a tree structure
  function positionNodesInTree(nodeId: string, x: number, y: number) {
    const childrenMap = nodeChildrenMap.get(nodeId)
    if (!childrenMap) return

    // Get current node dimensions
    const currentNodeDimensions = nodeDimensions.get(nodeId) || defaultDimensions

    // Calculate appropriate spacing based on current node dimensions
    const horizontalSpacing = Math.max(currentNodeDimensions.width * 1.5, 150)
    const verticalSpacing = Math.max(currentNodeDimensions.height * 2, 150)

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
        // Position the single child directly below its parent, ensuring exact alignment
        nodePositions.set(childId, { x, y: nextY })
        positionNodesInTree(childId, x, nextY)
        return
      }
    }

    // Handle branching nodes (nodes with multiple children)

    // Position left children
    if (childrenMap.left.length > 0) {
      // Calculate starting position for left children
      const leftChildId = childrenMap.left[0]
      const leftChildDimensions = nodeDimensions.get(leftChildId) || defaultDimensions
      const parentDimensions = nodeDimensions.get(nodeId) || defaultDimensions

      // Calculate offset considering both parent and child widths
      const leftOffset =
        (parentDimensions.width + leftChildDimensions.width) / 2 + horizontalSpacing / 2
      let leftX = x - leftOffset

      // If there's only one left child, position it directly to the left
      if (childrenMap.left.length === 1) {
        nodePositions.set(leftChildId, { x: leftX, y: nextY })
        positionNodesInTree(leftChildId, leftX, nextY)
      } else {
        // Multiple left children, distribute them
        for (const childId of childrenMap.left) {
          const childDimensions = nodeDimensions.get(childId) || defaultDimensions
          nodePositions.set(childId, { x: leftX, y: nextY })
          positionNodesInTree(childId, leftX, nextY)
          // Adjust spacing based on child width
          leftX -= horizontalSpacing + childDimensions.width / 2
        }
      }
    }

    // Position right children
    if (childrenMap.right.length > 0) {
      // Calculate starting position for right children
      const rightChildId = childrenMap.right[0]
      const rightChildDimensions = nodeDimensions.get(rightChildId) || defaultDimensions
      const parentDimensions = nodeDimensions.get(nodeId) || defaultDimensions

      // Calculate offset considering both parent and child widths
      const rightOffset =
        (parentDimensions.width + rightChildDimensions.width) / 2 + horizontalSpacing / 2
      let rightX = x + rightOffset

      // If there's only one right child, position it directly to the right
      if (childrenMap.right.length === 1) {
        nodePositions.set(rightChildId, { x: rightX, y: nextY })
        positionNodesInTree(rightChildId, rightX, nextY)
      } else {
        // Multiple right children, distribute them
        for (const childId of childrenMap.right) {
          const childDimensions = nodeDimensions.get(childId) || defaultDimensions
          nodePositions.set(childId, { x: rightX, y: nextY })
          positionNodesInTree(childId, rightX, nextY)
          // Adjust spacing based on child width
          rightX += horizontalSpacing + childDimensions.width / 2
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
        positionNodesInTree(childId, x, nextY)
      } else {
        // Multiple other children or there are also left/right children, distribute them evenly
        // Calculate total width needed for all children
        let totalWidth = 0
        const childWidths: number[] = []

        for (const childId of childrenMap.other) {
          const childDimensions = nodeDimensions.get(childId) || defaultDimensions
          childWidths.push(childDimensions.width)
          totalWidth += childDimensions.width
        }

        // Add spacing between nodes
        totalWidth += (childrenMap.other.length - 1) * horizontalSpacing

        // Calculate starting X position to center the group
        let currentX = x - totalWidth / 2

        childrenMap.other.forEach((childId, index) => {
          const childDimensions = nodeDimensions.get(childId) || defaultDimensions
          // Position the node and account for its width
          nodePositions.set(childId, {
            x: currentX + childDimensions.width / 2,
            y: nextY,
          })
          positionNodesInTree(childId, currentX + childDimensions.width / 2, nextY)

          // Move to the next position
          currentX += childDimensions.width + horizontalSpacing
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
  const [isInitialLayoutDone, setIsInitialLayoutDone] = useState(false)
  const layoutTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  // Clear any existing timeout to prevent multiple layout calculations
  const clearLayoutTimeout = () => {
    if (layoutTimeoutRef.current) {
      clearTimeout(layoutTimeoutRef.current)
      layoutTimeoutRef.current = null
    }
  }

  // Debounced layout calculation function
  const calculateLayout = useCallback(
    (delay = 100) => {
      clearLayoutTimeout()

      layoutTimeoutRef.current = setTimeout(() => {
        const layoutedNodesAndEdges = getLayoutedElements(nodes, edges)
        setNodes(layoutedNodesAndEdges.nodes)
        setEdges(layoutedNodesAndEdges.edges)
      }, delay)
    },
    [nodes, edges, setNodes, setEdges],
  )

  // Initial layout when component mounts
  useEffect(() => {
    if (!isInitialLayoutDone && nodes.length > 0) {
      const layoutedNodesAndEdges = getLayoutedElements(nodes, edges)
      setNodes(layoutedNodesAndEdges.nodes)
      setEdges(layoutedNodesAndEdges.edges)
      setIsInitialLayoutDone(true)

      // Add a delayed layout refresh to ensure nodes are properly positioned after rendering
      // but only do this once during initialization
      layoutTimeoutRef.current = setTimeout(() => {
        const refreshedLayout = getLayoutedElements(nodes, edges)
        setNodes(refreshedLayout.nodes)
        setEdges(refreshedLayout.edges)
      }, 300) // Reduced from 500ms to 300ms for faster response
    }

    return clearLayoutTimeout
  }, [nodes, edges, setNodes, setEdges, isInitialLayoutDone])

  // Add another effect that runs when nodes or edges change significantly
  // This uses the length as a dependency to avoid running on every minor change
  useEffect(() => {
    if (
      isInitialLayoutDone &&
      nodes.length > 0 &&
      window.document.querySelector(`[data-id="${nodes[0].id}"]`)
    ) {
      calculateLayout(200)
    }

    return clearLayoutTimeout
  }, [nodes.length, edges.length, isInitialLayoutDone, calculateLayout])

  const refreshLayoutedElements = useCallback(() => {
    calculateLayout(0) // Immediate calculation
  }, [calculateLayout])

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
