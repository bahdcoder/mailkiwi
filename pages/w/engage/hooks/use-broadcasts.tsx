import React from 'react'
import { usePageContext } from 'vike-react/usePageContext'
import type {
  BroadcastWithEmailContent,
  BroadcastGroup,
} from '#root/database/database_schema_types.js'
import type { EngagePageProps } from '#root/pages/w/engage/+Page.jsx'

export function useBroadcasts() {
  const { pageProps, urlParsed } = usePageContext()
  const { groups, broadcasts } = pageProps as EngagePageProps

  // Get current search and status from URL
  const currentSearch = urlParsed?.search?.search || ''
  const currentStatus = urlParsed?.search?.status || 'all'

  // Local state for search input (for immediate UI feedback)
  const [search, setSearch] = React.useState(currentSearch)

  // Check if user is actively searching or filtering
  const isSearchingOrFiltering = currentSearch || currentStatus !== 'all'

  // Filter broadcasts by group
  const getBroadcastsByGroup = React.useCallback(
    (group: BroadcastGroup): BroadcastWithEmailContent[] => {
      return broadcasts.filter((broadcast) => broadcast.broadcastGroupId === group.id)
    },
    [broadcasts],
  )

  // Get filtered groups (only groups that have broadcasts after filtering)
  const filteredGroups = React.useMemo(() => {
    return groups.filter((group) => getBroadcastsByGroup(group).length > 0)
  }, [groups, getBroadcastsByGroup])

  return {
    search,
    setSearch,
    currentSearch,
    currentStatus,
    broadcasts,
    groups: filteredGroups,
    getBroadcastsByGroup,
    totalBroadcasts: broadcasts.length,
    isSearchingOrFiltering,
    hasNoResults: broadcasts.length === 0 && isSearchingOrFiltering,
    hasNoBroadcasts: broadcasts.length === 0 && !isSearchingOrFiltering,
  }
}
