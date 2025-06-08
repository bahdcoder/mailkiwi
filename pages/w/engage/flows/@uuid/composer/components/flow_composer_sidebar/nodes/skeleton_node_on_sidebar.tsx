import { TrashIcon } from '#root/pages/components/icons/trash.svg.jsx'
import { Button } from '@kibamail/owly/button'
import type { PropsWithChildren } from 'react'
import type { AutomationStep } from '#root/database/database_schema_types.js'
import { Text } from '@kibamail/owly/text'

interface SkeletonNodeOnSidebarProps {
  step: AutomationStep
}

export function SkeletonNodeOnSidebar({
  children,
  step,
}: PropsWithChildren<SkeletonNodeOnSidebarProps>) {
  return (
    <div>
      <div className="w-full flex flex-col gap-1">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            icon here
            <Text className="text-sm capitalize">label here</Text>
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
