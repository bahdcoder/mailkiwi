import { type UseQueryOptions, useQuery } from '@tanstack/react-query'
import { useState } from 'react'

export function useServerQuery<TQueryFnData>(
  queryOptions: Omit<UseQueryOptions<TQueryFnData, unknown, TQueryFnData>, 'queryKey'> & {
    queryKey: string
    initialData?: TQueryFnData
  },
) {
  const { queryKey, ...restQueryOptions } = queryOptions
  const [enabled, setEnabled] = useState(false)

  const query = useQuery({
    queryKey: [queryKey],
    async queryFn() {
      const response = await fetch(queryKey, {
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
    enableQuery() {
      setEnabled(true)
    },
  }
}
