import type { AutomationStep } from '#root/database/database_schema_types.js'
import { SkeletonNodeOnSidebar } from '../skeleton_node_on_sidebar.jsx'

import * as TextField from '@kibamail/owly/text-field'

export interface ActionSendEmailNodeOnSidebarProps {
  step: AutomationStep
}

export function ActionSendEmailNodeOnSidebar({
  step,
}: ActionSendEmailNodeOnSidebarProps) {
  return (
    <SkeletonNodeOnSidebar step={step}>
      <div className="grid grid-cols-1 gap-4">
        <TextField.Root>
          <TextField.Label>Sender name</TextField.Label>
        </TextField.Root>
      </div>
    </SkeletonNodeOnSidebar>
  )
}
