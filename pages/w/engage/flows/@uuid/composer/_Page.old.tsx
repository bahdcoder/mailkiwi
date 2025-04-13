import './flow_composer_styles.css'
import { CancelIcon } from '@/pages/components/icons/cancel.svg.jsx'
import { FlowComposerSidebar } from '@/pages/w/engage/flows/@uuid/composer/components/flow_composer_sidebar.jsx'
import { useReactFlowNodes } from '@/pages/w/engage/flows/@uuid/composer/components/hooks/use_react_flow_nodes.js'
import { Badge } from '@kibamail/owly/badge'
import { Button } from '@kibamail/owly/button'
import { Heading } from '@kibamail/owly/heading'
import Dagre from '@dagrejs/dagre'
import {
  Background,
  Controls,
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type Edge,
  ReactFlowProvider,
} from '@xyflow/react'
import React from 'react'
import { AddFlowActionEdge } from '@/pages/w/engage/flows/@uuid/composer/components/edges/add_flow_action_edge.jsx'
import { automationNodeTypes } from '@/pages/w/engage/flows/@uuid/composer/components/nodes/index.js'

const VERTICAL_SPACING = 400

function EngageCreateFlowPage() {
  const { nodes, edges, onNodesChange, onEdgesChange, refreshLayoutedElements } =
    useReactFlowNodes({
      initialNodes: [
        {
          id: '0',
          position: { x: 0, y: 0 },
          type: 'trigger',
          data: {
            id: Date.now().toString(),
            subtype: 'TRIGGER_CONTACT_TAG_ADDED',
            type: 'TRIGGER',
            label: 'Tag added',
          },
          draggable: false,
        },
        {
          id: '1',
          position: { x: 0, y: 0 },
          type: 'if_else',
          data: {
            id: Date.now().toString(),
            subtype: 'RULE_IF_ELSE',
            type: 'RULE',
            label: 'If else rule',
          },
          draggable: false,
        },
        {
          id: '2',
          position: { x: 0, y: 0 },
          type: 'send_email',
          data: {
            id: Date.now().toString(),
            subtype: 'ACTION_SEND_EMAIL',
            type: 'ACTION',
            label: 'Send email - 1',
          },
          draggable: false,
        },
        {
          id: '3',
          position: { x: 0, y: 0 },
          type: 'send_email',
          data: {
            id: Date.now().toString(),
            subtype: 'ACTION_SEND_EMAIL',
            type: 'ACTION',
            label: 'Send email - 2',
          },
          draggable: false,
        },
      ],
      initialEdges: [
        {
          id: '0-1',
          source: '0',
          target: '1',
          type: 'default',
        },
        {
          id: '1-2',
          source: '1',
          target: '2',
          type: 'default',
          data: {
            position: 'left',
          },
        },
        {
          id: '1-3',
          source: '1',
          target: '3',
          type: 'default',
          data: {
            position: 'right',
          },
        },
      ],
    })

  return (
    <div className="w-screen h-screen flex flex-col px-2 pb-2">
      <div className="h-[60px] flex items-center justify-between px-3">
        <div className="flex items-center gap-4">
          <Button variant="tertiary">
            <CancelIcon className="!w-6 !h-6" />
          </Button>

          <Heading size="xs">Untitled flow</Heading>
        </div>

        <div className="flex items-center gap-4">
          <Badge variant="neutral">Draft</Badge>
          <Button>Publish</Button>
        </div>
      </div>

      <div className="flex-grow border kb-border-tertiary rounded-lg flex">
        <div className="flex-grow h-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            edgeTypes={{
              default: AddFlowActionEdge,
            }}
            nodeTypes={automationNodeTypes}
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>
        <FlowComposerSidebar />
      </div>
    </div>
  )
}

export { EngageCreateFlowPage as Page }
