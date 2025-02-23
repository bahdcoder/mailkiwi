import * as Dropdown from '@/pages/components/dropdown/dropdown.jsx'
import { MoreVertIcon } from '@/pages/components/icons/more-vert.svg.jsx'
import {
  columnHelper,
  columns as defaultColumns,
} from '@/pages/w/engage/contacts/components/columns.js'
import type { FilterCondition } from '@/pages/w/engage/contacts/components/filters.jsx'
import { Button } from '@kibamail/owly/button'
import { Text } from '@kibamail/owly/text'
import { useQuery } from '@tanstack/react-query'
import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import cn from 'classnames'
import React from 'react'
import { useDebounce } from 'use-debounce'
import { usePageContext } from 'vike-react/usePageContext'

import type { CreateSegmentDto } from '@/audiences/dto/segments/create_segment_dto.js'

import type { ContactWithTagsAndProperties } from '@/database/database_schema_types.js'
import type { KnownAudienceProperty } from '@/database/schema.js'

import { route } from '@/shared/routes/route_aliases.js'

export type ServerContactsPageProps = {
  contacts: { data: ContactWithTagsAndProperties[]; total: number }
}

export function useContacts() {
  const [enabled, setEnabled] = React.useState(false)
  const [filters, setFilters] = React.useState<FilterCondition[]>([])
  const [deletedFilters, setDeletedFilters] = React.useState<Record<string, boolean>>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [search, setSearch] = React.useState<string>('')
  const ctx = usePageContext()
  const [isEditingProperty, setIsEditingProperty] =
    React.useState<KnownAudienceProperty | null>(null)
  const [isDeletingProperty, setIsDeletingProperty] =
    React.useState<KnownAudienceProperty | null>(null)
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
    () =>
      filters.filter(
        (filter) =>
          !deletedFilters[filter.id] &&
          (Array.isArray(filter.value) ? filter.value.length > 0 : filter.value),
      ),
    [filters, deletedFilters],
  )

  function onClearFilters() {
    setSearch('')
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

  const filterGroups = React.useMemo(() => {
    const searchGroups: CreateSegmentDto['filterGroups']['groups'][number]['conditions'] =
      debouncedSearch
        ? [
            {
              field: 'email',
              operation: 'contains',
              value: debouncedSearch,
            },
            {
              field: 'lastName',
              operation: 'contains',
              value: debouncedSearch,
            },
            {
              field: 'firstName',
              operation: 'contains',
              value: debouncedSearch,
            },
          ]
        : []

    const groups: CreateSegmentDto['filterGroups'] = {
      type: 'AND',
      groups: [
        {
          type: 'AND',
          conditions: activeFilters,
        },
        {
          type: 'OR',
          conditions: searchGroups,
        },
      ],
    }

    return groups
  }, [activeFilters, debouncedSearch])

  const contactsQuery = useQuery<{
    data: ContactWithTagsAndProperties[]
    total: number
  }>({
    queryKey: ['contacts', debouncedSearch, filterGroups, pagination],
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
          'contacts_search',
          { audienceId: ctx.audience.id },
          {
            page: (pagination.pageIndex + 1).toString(),
            perPage: pagination.pageSize.toString(),
          },
        ),
        {
          method: 'post',
          body: JSON.stringify({
            filters: filterGroups,
          }),
          headers: { 'Content-Type': 'application/json' },
        },
      )

      return response.json()
    },
    enabled,
  })

  const { data } = contactsQuery

  React.useEffect(() => {
    if (filters.length > 0 || search || pagination.pageIndex > 0) {
      setEnabled(true)
    }
  }, [filters, pagination.pageIndex, search])

  const columns = React.useMemo(
    () => [
      ...defaultColumns,
      ...(ctx.audience.knownProperties
        ?.filter((property) => !property.archived)
        .map((property) => {
          return columnHelper.accessor((row) => row.firstName, {
            id: property.id,
            cell(info) {
              return <Text>{info.getValue()}</Text>
            },
            header: () => {
              const actions = [
                {
                  name: 'Edit property',
                  type: 'default',
                  handle() {
                    setIsEditingProperty(property)
                  },
                },
                {
                  name: 'Delete property',
                  type: 'destructive',
                  handle() {
                    setIsDeletingProperty(property)
                  },
                },
              ]

              return (
                <div className="flex items-center justify-between">
                  <Text>{property.label}</Text>

                  <Dropdown.Root>
                    <Dropdown.Trigger asChild>
                      <Button variant="tertiary">
                        <MoreVertIcon className="w-4 h-4" />
                      </Button>
                    </Dropdown.Trigger>

                    <Dropdown.Portal>
                      <Dropdown.Content align="end">
                        {actions.map((action) => (
                          <Dropdown.Item
                            key={action.name}
                            className={cn(
                              'w-full bg-transparent rounded-lg px-2 cursor-pointer hover:bg-[var(--background-secondary)] h-8 flex items-center justify-start',
                              {
                                'text-[var(--kb-content-negative)]':
                                  action.type === 'destructive',
                              },
                            )}
                            asChild
                            onSelect={action.handle}
                          >
                            <Button
                              variant="tertiary"
                              data-testid={`w-contacts-custom-property-${property.id}-edit-action`}
                            >
                              <Text
                                className={cn({
                                  'text-[var(--content-negative)]':
                                    action.type === 'destructive',
                                })}
                              >
                                {action.name}
                              </Text>
                            </Button>
                          </Dropdown.Item>
                        ))}
                      </Dropdown.Content>
                    </Dropdown.Portal>
                  </Dropdown.Root>
                </div>
              )
            },
            meta: {
              style: {
                minWidth: 160,
              },
            },
          })
        }) ?? []),
    ],
    [ctx.audience.knownProperties],
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
        left: ['email'],
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

    filterGroups,

    // properties
    isEditingProperty,
    setIsEditingProperty,
    isDeletingProperty,
    setIsDeletingProperty,
  }
}
