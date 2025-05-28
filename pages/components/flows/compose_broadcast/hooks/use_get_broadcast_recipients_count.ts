import { useQuery } from '@tanstack/react-query'
import { usePageContext } from 'vike-react/usePageContext'

import { route } from '#root/core/shared/routes/route_aliases.js'

export function useGetBroadcastRecipientsCount(segmentId: string) {
  const { audience } = usePageContext()

  return useQuery<{ total: number }>({
    queryKey: ['broadcasts-recipients-count', segmentId],
    async queryFn() {
      const response = await fetch(
        route(
          'contacts_search',
          { audienceId: audience?.id },
          {
            perPage: '1',
          },
        ),
        {
          method: 'post',
          body: JSON.stringify({
            filters:
              segmentId !== 'all'
                ? {
                    type: 'AND',
                    groups: [
                      {
                        type: 'AND',
                        conditions: [
                          {
                            field: 'segmentId',
                            operation: 'eq',
                            value: segmentId,
                          },
                        ],
                      },
                    ],
                  }
                : { type: 'AND', groups: [] },
          }),
          headers: { 'Content-Type': 'application/json' },
        },
      )

      const json = await response.json()

      if (!response.ok) {
        throw json
      }

      return json
    },
  })
}
