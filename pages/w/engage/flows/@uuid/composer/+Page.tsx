import { usePageProps } from '@/pages/hooks/use_page_props.js'
import { Flow } from './automation-flow/automation-flow-builder.jsx'

import './flow_composer_styles.css'
import { CancelIcon } from '@/pages/components/icons/cancel.svg.jsx'
import { FlowComposerSidebar } from '@/pages/w/engage/flows/@uuid/composer/components/flow_composer_sidebar.jsx'
import { Badge } from '@kibamail/owly/badge'
import { Button } from '@kibamail/owly/button'
import { Heading } from '@kibamail/owly/heading'
import React from 'react'
import type { AutomationWithSteps } from '@/database/database_schema_types.js'
import { EditPencilIcon } from '@/pages/components/icons/edit-pencil.svg.jsx'

function EngageCreateFlowPage() {
  const pageProps = usePageProps<{ automation: AutomationWithSteps }>()

  return (
    <div className="w-full h-screen flex box-border flex-col px-2 pb-2">
      <div className="h-[60px] w-full flex items-center justify-between px-3 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="tertiary">
            <CancelIcon className="!w-6 !h-6" />
          </Button>

          <Heading size="xs" className="mb-0 flex items-center">
            {pageProps.automation.name || 'Untitled Flow'}

            <Button variant="tertiary" size="sm" className="ml-2">
              <EditPencilIcon className="kb-content-tertiary" />
            </Button>
          </Heading>
        </div>

        <div className="flex items-center gap-4">
          <Badge variant="neutral">Draft</Badge>
          <Button>Publish</Button>
        </div>
      </div>

      <div className="flex-grow border kb-border-tertiary rounded-lg flex max-w-full">
        <div
          className="flex-grow h-full max-h-[90vh] overflow-hidden"
          id="automation-flow-container-wrapper"
        >
          <Flow />
        </div>
        <FlowComposerSidebar />
      </div>
    </div>
  )
}

export { EngageCreateFlowPage as Page }
