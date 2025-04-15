import type { AutomationElement } from "@/pages/w/engage/flows/@uuid/composer/automation-flow/types/elements.js"
import { cloneDeep } from "@/pages/w/engage/flows/@uuid/composer/automation-flow/utils/clone_deep.js"
import dagre from "dagre"
import { isNode, Position } from "react-flow-renderer"

const nodeWidth = 300
const nodeHeight = 92

const getLayoutedElements = (_elements: AutomationElement[]) => {
  const elements = cloneDeep(_elements)
  const dagreGraph = new dagre.graphlib.Graph()

  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({ rankdir: "TB", ranksep: 150 })

  elements.forEach((el) => {
    if (isNode(el)) {
      dagreGraph.setNode(el.id, {
        width: el.width || nodeWidth,
        height: el.height || nodeHeight,
      })
    } else {
      dagreGraph.setEdge(el.source, el.target)
    }
  })

  dagre.layout(dagreGraph)

  return elements.map((el) => {
    if (isNode(el)) {
      const nodeWithPosition = dagreGraph.node(el.id)
      el.targetPosition = Position.Top
      el.sourcePosition = Position.Bottom
      el.position = {
        x:
          nodeWithPosition.x -
          (el.width || nodeWidth) / 2 +
          Math.random() / 1000,
        y: nodeWithPosition.y - (el.height || nodeHeight) / 2,
      }
    }
    return el
  })
}

export { getLayoutedElements }
