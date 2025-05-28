import type { AutomationElement } from '#root/pages/w/engage/flows/@uuid/composer/automation-flow/types/elements.js'
import { cloneDeep } from '#root/pages/w/engage/flows/@uuid/composer/automation-flow/utils/clone_deep.js'
import dagre from 'dagre'
import { Position, isNode } from 'react-flow-renderer'

const nodeWidth = 300
const nodeHeight = 92

/**
 * Calculates the visual layout for automation workflow elements.
 *
 * This function is responsible for positioning nodes and edges in the automation workflow
 * visualization. It uses the dagre graph layout library to automatically arrange nodes in
 * a hierarchical top-to-bottom layout that clearly shows the flow of the automation.
 *
 * The layout algorithm ensures that:
 * - Nodes are arranged in a logical flow from top to bottom
 * - Nodes don't overlap each other
 * - Edges are routed cleanly between nodes
 * - The overall layout is visually balanced and easy to understand
 *
 * This visualization is critical for the user experience of the automation builder,
 * as it helps users understand the flow and relationships between automation steps.
 *
 * @param _elements - The automation elements (nodes and edges) to layout
 * @returns The same elements with calculated position properties
 */
const getLayoutedElements = (_elements: AutomationElement[]) => {
  // Create a deep clone to avoid modifying the original elements
  const elements = cloneDeep(_elements)

  // Initialize a new dagre graph for layout calculation
  const dagreGraph = new dagre.graphlib.Graph()

  // Configure the graph layout settings
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({
    rankdir: 'TB', // Top to bottom layout direction
    ranksep: 150, // Vertical separation between nodes
  })

  // Add all nodes and edges to the dagre graph for layout calculation
  for (const el of elements) {
    if (isNode(el)) {
      // For nodes, set their dimensions for the layout algorithm
      // This ensures proper spacing and prevents overlaps
      dagreGraph.setNode(el.id, {
        width: el.width || nodeWidth, // Use element width or default
        height: el.height || nodeHeight, // Use element height or default
      })
    } else {
      // For edges, define the connection between source and target nodes
      dagreGraph.setEdge(el.source, el.target)
    }
  }

  // Run the dagre layout algorithm to calculate positions
  dagre.layout(dagreGraph)

  // Apply the calculated positions to the original elements
  return elements.map((el) => {
    if (isNode(el)) {
      // Get the calculated position for this node
      const nodeWithPosition = dagreGraph.node(el.id)

      // Set connection points at top and bottom of nodes for a clean vertical flow
      el.targetPosition = Position.Top // Where incoming connections attach
      el.sourcePosition = Position.Bottom // Where outgoing connections attach

      // Calculate the final position, centering the node on its calculated position
      // The tiny random offset prevents React Flow from sometimes failing to render edges
      // when nodes are perfectly aligned
      el.position = {
        x: nodeWithPosition.x - (el.width || nodeWidth) / 2 + Math.random() / 1000,
        y: nodeWithPosition.y - (el.height || nodeHeight) / 2,
      }
    }
    return el
  })
}

export { getLayoutedElements }
