import type { AutomationStepSubType } from '#root/database/types/automations.js'
import { useAutomationFlowBuilder } from '../../automation-flow/state/automation-flow-context.jsx'
import { ActionSendEmailNodeOnSidebar } from './nodes/actions/action_send_email_node_on_sidebar.jsx'
import type React from 'react'
import type { AutomationStep } from '#root/database/database_schema_types.js'

const nodesToSidebarOptions: Partial<
  Record<AutomationStepSubType, (props: { step: AutomationStep }) => React.JSX.Element>
> = {
  ACTION_SEND_EMAIL: ActionSendEmailNodeOnSidebar,
}

export function FlowComposerSidebar() {
  const { selectedNode } = useAutomationFlowBuilder()

  const Node = selectedNode
    ? nodesToSidebarOptions[selectedNode?.data?.step?.subtype]
    : null

  return (
    <div className="w-[360px] box-border p-4 shrink-0 h-full border-l kb-border-tertiary">
      {Node && selectedNode ? <Node step={selectedNode?.data?.step} /> : null}
    </div>
  )
}
