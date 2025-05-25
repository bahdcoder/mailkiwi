import { usePageContextWithProps } from '#root/pages/hooks/use_page_props.js'
import { Flow } from './automation-flow/automation-flow-builder.jsx'

import './flow_composer_styles.css'
import type { AutomationWithSteps } from '#root/database/database_schema_types.js'
import { CancelIcon } from '#root/pages/components/icons/cancel.svg.jsx'
import { EditPencilIcon } from '#root/pages/components/icons/edit-pencil.svg.jsx'
import { FlowComposerSidebar } from '#root/pages/w/engage/flows/@uuid/composer/components/flow_composer_sidebar/flow_composer_sidebar.jsx'
import { Badge } from '@kibamail/owly/badge'
import { Button } from '@kibamail/owly/button'
import { Heading } from '@kibamail/owly/heading'
import React from 'react'
import { AutomationFlowProvider } from './automation-flow/state/automation-flow-context.jsx'
import { route } from '#root/core/shared/routes/route_aliases.js'

function EngageCreateFlowPage() {
  const { pageProps } = usePageContextWithProps<{ automation: AutomationWithSteps }>()

  return (
    <AutomationFlowProvider>
      <div className="w-full h-screen flex box-border flex-col px-2 pb-2">
        <div className="h-[60px] w-full flex items-center justify-between px-3 shrink-0">
          <div className="flex items-center gap-4">
            <Button variant="tertiary" asChild>
              <a href={route('engage_automations')}>
                <CancelIcon className="w-6! h-6!" />
              </a>
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

        <div className="grow border kb-border-tertiary rounded-lg flex max-w-full">
          <div
            className="grow h-full max-h-[90vh] overflow-hidden"
            id="automation-flow-container-wrapper"
          >
            <Flow />
          </div>
          <FlowComposerSidebar />
        </div>
      </div>
    </AutomationFlowProvider>
  )
}

export { EngageCreateFlowPage as Page }
