import React from "react"
import ReactFlow, {
  ReactFlowProvider,
  Background,
  BackgroundVariant,
} from "react-flow-renderer"
import { nodeTypes } from "./nodes/index.js"
import { edgeTypes } from "./edges/index.js"
import { getLayoutedElements } from "./utils/WorkflowLayoutUtils.js"
import "./styles.css"
import "react-flow-renderer/dist/style.css"
import { AutomationElement } from "@/pages/w/engage/flows/@uuid/composer/automation-flow/types/elements.js"

export interface AutomationProps {
  elements: AutomationElement[]
}

export const Automation = ({ elements }: AutomationProps) => {
  const [layoutElements, setLayoutElements] = React.useState<
    AutomationElement[]
  >([])

  React.useEffect(() => {
    setLayoutElements(getLayoutedElements(elements))
  }, [elements])

  const layoutNodes = layoutElements.filter((x) => x.position)
  const layoutEdges = layoutElements.filter((x) => !x.position)

  function getReactFlowContainerDefaultPosition() {
    if (typeof document === "undefined") {
      return [300, 50]
    }

    const container = document.querySelector(
      "#automation-flow-container-wrapper"
    )

    if (!container) {
      return [300, 50]
    }

    const { width } = container.getBoundingClientRect()

    return [width / 3, 50]
  }

  return (
    <div className="w-full h-full">
      <ReactFlowProvider>
        {/* @ts-expect-error */}
        <ReactFlow
          nodes={layoutNodes}
          edges={layoutEdges}
          nodesDraggable={false}
          nodesConnectable={false}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          panOnScroll
          defaultPosition={getReactFlowContainerDefaultPosition()}
          panOnDrag
          preventScrolling
        >
          <Background
            className="!z-[2]"
            variant={BackgroundVariant.Dots}
            color="var(--content-secondary)"
          />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  )
}
