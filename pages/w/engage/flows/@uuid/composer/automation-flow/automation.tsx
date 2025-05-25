import React from 'react'
import ReactFlow, {
  ReactFlowProvider,
  Background,
  BackgroundVariant,
} from 'react-flow-renderer'
import { edgeTypes } from './edges/index.js'
import { nodeTypes } from './nodes/index.js'
import { getLayoutedElements } from './utils/workflow-layout.js'
import './styles.css'
import 'react-flow-renderer/dist/style.css'
import type {
  AutomationElement,
  NodeElement,
} from '#root/pages/w/engage/flows/@uuid/composer/automation-flow/types/elements.js'

export interface AutomationProps {
  elements: AutomationElement[]
}

export const Automation = ({ elements }: AutomationProps) => {
  const [layoutElements, setLayoutElements] = React.useState<AutomationElement[]>([])

  React.useEffect(() => {
    setLayoutElements(getLayoutedElements(elements))
  }, [elements])

  const layoutNodes = layoutElements.filter(
    (element) => (element as NodeElement).position,
  )
  const layoutEdges = layoutElements.filter(
    (element) => !(element as NodeElement).position,
  )

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
          panOnDrag
          preventScrolling
          fitView
        >
          <Background
            className="z-2!"
            variant={BackgroundVariant.Dots}
            color="var(--content-secondary)"
          />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  )
}
