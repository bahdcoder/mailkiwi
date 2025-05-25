import './styles.css'
import { SearchIcon } from '#root/pages/components/icons/search.svg.jsx'
import { Heading } from '@kibamail/owly/heading'
import * as Tabs from '@kibamail/owly/tabs'
import * as TextField from '@kibamail/owly/text-field'
import * as React from 'react'
import { usePageContext } from 'vike-react/usePageContext'

import type {
  BroadcastGroup,
  BroadcastWithEmailContent,
} from '#root/database/database_schema_types.js'

import { EmptyState } from '#root/pages/components/empty-state/empty_state.jsx'
import { CreateBroadcastFlow } from '#root/pages/components/flows/compose_broadcast/create_broadcast_flow.jsx'
import { BroadcastRow } from '#root/pages/w/engage/components/broadcast_row.jsx'
import { route } from '#root/core/shared/routes/route_aliases.js'
import { Button } from '@kibamail/owly/button'
import type { DefaultPageProps } from '#root/pages/types/page-context.js'

enum BroadcastStatusFilters {
  DRAFT = 'draft',
  SENT = 'sent',
  SCHEDULED = 'scheduled',
  ALL = 'all',
}

export interface EngagePageProps extends DefaultPageProps {
  groups: BroadcastGroup[]
  broadcasts: BroadcastWithEmailContent[]
}

function EngagePage() {
  const { pageProps, urlParsed } = usePageContext()

  const defaultTabValue = urlParsed?.search?.status ?? BroadcastStatusFilters.ALL

  const { groups, broadcasts } = pageProps as EngagePageProps

  function getBroadcastsByGroup(group: BroadcastGroup) {
    return broadcasts.filter((broadcast) => broadcast.broadcastGroupId === group.id)
  }

  const noBroadcasts = broadcasts.length === 0

  if (noBroadcasts) {
    return (
      <EmptyState title="No broadcasts yet" description="Try creating a new broadcast.">
        <CreateBroadcastFlow>
          <Button>Compose a broadcast</Button>
        </CreateBroadcastFlow>
      </EmptyState>
    )
  }

  return (
    <Tabs.Content value="broadcasts" className="pt-6">
      <Tabs.Root variant="primary" defaultValue={defaultTabValue} width={'full'}>
        <div className="w-full flex flex-col gap-y-2 lg:gap-y-0 lg:flex-row items-center lg:justify-between">
          <div className="w-full lg:max-w-72">
            <TextField.Root
              type="search"
              placeholder="Search broadcasts"
              className="w-search-broadcasts"
            >
              <TextField.Slot side="left">
                <SearchIcon />
              </TextField.Slot>
            </TextField.Root>
          </div>

          <div className="w-full lg:w-auto">
            <Tabs.List className="lg:w-fit">
              <Tabs.Trigger value={BroadcastStatusFilters.ALL} asChild>
                <a href={route('engage')}>All</a>
              </Tabs.Trigger>
              <Tabs.Trigger value={BroadcastStatusFilters.SENT} asChild>
                <a href={route('engage', {}, { status: 'sent' })}>Sent</a>
              </Tabs.Trigger>
              <Tabs.Trigger value={BroadcastStatusFilters.SCHEDULED} asChild>
                <a href={route('engage', {}, { status: 'scheduled' })}>Scheduled</a>
              </Tabs.Trigger>
              <Tabs.Trigger value={BroadcastStatusFilters.DRAFT} asChild>
                <a href={route('engage', {}, { status: 'draft' })}>Drafts</a>
              </Tabs.Trigger>
              <Tabs.Indicator />
            </Tabs.List>
          </div>
        </div>

        <div
          className="w-full max-w-[calc(100vw-var(--w-sidebar-width)-64px)] pt-4 flex flex-col gap-8 pb-32"
          data-orientation="horizontal"
          role="tabpanel"
        >
          {groups.map((group) => (
            <div key={group.id} className="">
              <Heading
                size="sm"
                className="px-2 font-display kb-content-brand capitalize"
              >
                {group?.name}
              </Heading>
              <div className="flex flex-col">
                {getBroadcastsByGroup(group).map((broadcast) => (
                  <BroadcastRow key={broadcast.id} broadcast={broadcast} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Tabs.Root>
    </Tabs.Content>
  )
}

export { EngagePage as Page }
