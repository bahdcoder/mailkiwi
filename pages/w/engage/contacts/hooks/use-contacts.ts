import { columns } from "@/pages/w/engage/contacts/components/columns.js"
import { FilterCondition } from "@/pages/w/engage/contacts/components/filters.jsx"
import { useQuery } from "@tanstack/react-query"
import { getCoreRowModel, useReactTable } from "@tanstack/react-table"
import React from "react"
import { useDebounce } from "use-debounce"
import { usePageContext } from "vike-react/usePageContext"

import { ContactWithTagsAndProperties } from "@/database/database_schema_types.js"

import { route } from "@/shared/routes/route_aliases.js"

export type ServerContactsPageProps = {
  contacts: { data: ContactWithTagsAndProperties[]; total: number }
}

export function useContacts() {
  const [enabled, setEnabled] = React.useState(false)
  const [filters, setFilters] = React.useState<FilterCondition[]>([])
  const [deletedFilters, setDeletedFilters] = React.useState<Record<string, boolean>>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [search, setSearch] = React.useState<string>("")
  const ctx = usePageContext()
  const pageProps = usePageContext().pageProps as ServerContactsPageProps
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 100,
  })

  const tagNames = React.useMemo(() => {
    return ctx.tags.reduce(
      (acc, tag) => {
        acc[tag.id] = tag.name
        return acc
      },
      {} as Record<string, string>,
    )
  }, [ctx.tags])

  const [debouncedSearch] = useDebounce(search, 300)

  const activeFilters = React.useMemo(
    function () {
      return filters.filter(
        (filter) =>
          !deletedFilters[filter.id] &&
          (Array.isArray(filter.value) ? filter.value.length > 0 : filter.value),
      )
    },
    [filters, deletedFilters],
  )

  function onClearFilters() {
    setSearch("")
    setRowSelection({})
    table.resetPageIndex()

    setDeletedFilters((current) => {
      const newState = { ...current }

      filters.forEach((filter) => {
        newState[filter.id] = true
      })

      return newState
    })
  }

  const contactsQuery = useQuery<{ data: ContactWithTagsAndProperties[]; total: number }>(
    {
      queryKey: ["contacts", debouncedSearch, activeFilters, pagination],
      // initialData: { total: pageProps.contacts.total, data: pageProps.contacts.data },
      initialData() {
        if (enabled) {
          return undefined
        }

        return { total: pageProps.contacts.total, data: pageProps.contacts.data }
      },
      async queryFn() {
        const response = await fetch(
          route(
            "contacts_search",
            { audienceId: ctx.audience.id },
            {
              page: (pagination.pageIndex + 1).toString(),
              perPage: pagination.pageSize.toString(),
            },
          ),
          {
            method: "post",
            body: JSON.stringify({
              filters: {
                type: "AND",
                groups: [
                  {
                    type: "AND",
                    conditions: activeFilters,
                  },
                  ...(search
                    ? [
                        {
                          type: "OR",
                          conditions: [
                            {
                              field: "email",
                              operation: "contains",
                              value: debouncedSearch,
                            },
                            {
                              field: "lastName",
                              operation: "contains",
                              value: debouncedSearch,
                            },
                            {
                              field: "firstName",
                              operation: "contains",
                              value: debouncedSearch,
                            },
                          ],
                        },
                      ]
                    : []),
                ],
              },
            }),
            headers: { "Content-Type": "application/json" },
          },
        )

        return response.json()
      },
      enabled,
    },
  )

  const { data } = contactsQuery

  React.useEffect(
    function () {
      if (filters.length > 0 || search || pagination.pageIndex > 0) {
        setEnabled(true)
      }
    },
    [filters, pagination.pageIndex, search],
  )

  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    pageCount: Math.ceil((data?.total ?? 0) / pagination.pageSize),
    manualPagination: true,
    state: {
      rowSelection,
      pagination,
    },
    enableRowSelection: true,
    getRowId(row) {
      return row.id
    },
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    initialState: {
      columnPinning: {
        left: ["emailAddress"],
      },
    },
  })

  return {
    table,
    onClearFilters,
    tagNames,
    filters,
    setFilters,
    setDeletedFilters,
    setSearch,
    setRowSelection,
    setPagination,
    pagination,
    data,
    activeFilters,
    contactsQuery,
  }
}
