import { type UseQueryOptions, useQuery } from '@tanstack/react-query'
import { useState } from 'react'

export function useServerQuery<TQueryFnData>(
  queryOptions: Omit<UseQueryOptions<TQueryFnData, unknown, TQueryFnData>, 'queryKey'> & {
    queryKey: string[] | string
    initialData?: TQueryFnData
  },
) {
  const { queryKey, ...restQueryOptions } = queryOptions
  const [enabled, setEnabled] = useState(false)

  const query = useQuery({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    async queryFn() {
      const response = await fetch(Array.isArray(queryKey) ? queryKey?.[0] : queryKey, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const json = await response.json()

      return json.payload
    },
    enabled,
    ...restQueryOptions,
  })

  return {
    ...query,
    refetchQuery() {
      if (enabled) {
        query.refetch()

        return
      }

      setEnabled(true)
    },
  }
}
