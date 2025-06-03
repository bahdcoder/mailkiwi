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

  const currentSearch = urlParsed?.search?.search || ''
  const currentStatus = urlParsed?.search?.status || 'all'

  const [search, setSearch] = React.useState(currentSearch)

  const isSearchingOrFiltering = currentSearch || currentStatus !== 'all'

  const getBroadcastsByGroup = React.useCallback(
    (group: BroadcastGroup): BroadcastWithEmailContent[] => {
      return broadcasts.filter((broadcast) => broadcast.broadcastGroupId === group.id)
    },
    [broadcasts],
  )

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
