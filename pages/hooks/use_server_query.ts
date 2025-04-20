import { type UseQueryOptions, useQuery } from '@tanstack/react-query'

export function useServerQuery<TQueryFnData>(
  queryOptions: Omit<UseQueryOptions<TQueryFnData, unknown, TQueryFnData>, 'queryKey'> & {
    queryKey: string
    initialData?: TQueryFnData
  },
) {
  const { queryKey, ...restQueryOptions } = queryOptions

  return useQuery({
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
    enabled: false,
    ...restQueryOptions,
  })
}
