import { TrashIcon } from '#root/pages/components/icons/trash.svg.jsx'
import { Button } from '@kibamail/owly/button'
import { icons } from '#root/pages/w/engage/flows/@uuid/composer/automation-flow/components/add-node-dialog.jsx'
import type { PropsWithChildren } from 'react'
import type { AutomationStep } from '#root/database/database_schema_types.js'
import { Text } from '@kibamail/owly/text'
import { nodeLabels } from '#root/pages/w/engage/flows/@uuid/composer/automation-flow/nodes/skeleton_node.jsx'

export interface SkeletonNodeOnSidebarProps {
  step: AutomationStep
}

export function SkeletonNodeOnSidebar({
  children,
  step,
}: PropsWithChildren<SkeletonNodeOnSidebarProps>) {
  const Icon = icons[step.subtype]

  return (
    <div>
      <div className="w-full flex flex-col gap-1">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            {Icon ? <Icon className="w-4! h-4! font-medium kb-content-tertiary" /> : null}
            <Text className="text-sm capitalize">
              {nodeLabels[step.subtype]?.toLowerCase()}
            </Text>
          </div>

          <Button variant="tertiary">
            <TrashIcon />
          </Button>
        </div>
      </div>

      <div className="my-2 h-px bg-(--border-tertiary) w-full" />
      {children}
    </div>
  )
}
