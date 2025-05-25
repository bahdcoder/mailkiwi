import * as Dropdown from '#root/pages/components/dropdown/dropdown.jsx'
import { MoreVertIcon } from '#root/pages/components/icons/more-vert.svg.jsx'
import {
  columnHelper,
  columns as defaultColumns,
} from '#root/pages/w/engage/contacts/components/columns.js'
import type { FilterCondition } from '#root/pages/w/engage/contacts/components/filters.jsx'
import { Button } from '@kibamail/owly/button'
import { Text } from '@kibamail/owly/text'
import { useQuery } from '@tanstack/react-query'
import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import cn from 'classnames'
import React from 'react'
import { useDebounce } from 'use-debounce'
import { usePageContext } from 'vike-react/usePageContext'

import type { CreateSegmentDto } from '#root/core/audiences/dto/segments/create_segment_dto.js'

import type {
  ContactWithTagsAndProperties,
  Tag,
} from '#root/database/database_schema_types.js'
import type { KnownAudienceProperty } from '#root/database/schema.js'

import { route } from '#root/core/shared/routes/route_aliases.js'
import dayjs from 'dayjs'
import { DefaultPageProps } from '#root/pages/types/page-context.js'
import { usePageContextWithProps } from '#root/pages/hooks/use_page_props.js'

export interface ServerContactsPageProps {
  contacts: { data: ContactWithTagsAndProperties[]; total: number }
  tags: Tag[]
}

export function useContacts() {
  const [enabled, setEnabled] = React.useState(false)
  const [filters, setFilters] = React.useState<FilterCondition[]>([])
  const [deletedFilters, setDeletedFilters] = React.useState<Record<string, boolean>>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [search, setSearch] = React.useState<string>('')
  const { pageProps: ctx } = usePageContext()
  const [isEditingProperty, setIsEditingProperty] =
    React.useState<KnownAudienceProperty | null>(null)
  const [isDeletingProperty, setIsDeletingProperty] =
    React.useState<KnownAudienceProperty | null>(null)
  const {
    pageProps: { tags, contacts },
    audience,
  } = usePageContextWithProps<ServerContactsPageProps>()
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 100,
  })

  const tagNames = React.useMemo(() => {
    return tags.reduce(
      (acc, tag) => {
        acc[tag.id] = tag.name
        return acc
      },
      {} as Record<string, string>,
    )
  }, [tags])

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

      for (const filter of filters) {
        newState[filter.id] = true
      }

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

      return { total: contacts.total, data: contacts.data }
    },
    async queryFn() {
      const response = await fetch(
        route(
          'contacts_search',
          { audienceId: audience.id },
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
      ...(audience.knownProperties
        ?.filter((property) => !property.archived)
        .map((property) => {
          return columnHelper.accessor((row) => row.firstName, {
            id: property.id,
            cell(info) {
              const properties = info.row.original.parsedProperties

              let value = properties?.[property.id]

              if (value && property.type === 'date') {
                value = dayjs(value as Date).format('DD/MM/YYYY')
              }

              return <Text>{(value as React.ReactNode) ?? '---'}</Text>
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
                              'w-full bg-transparent rounded-lg px-2 cursor-pointer hover:bg-(--background-secondary) h-8 flex items-center justify-start',
                              {
                                'text-(--kb-content-negative)':
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
                                  'text-(--content-negative)':
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
                minWidth: '220px',
              },
            },
          })
        }) ?? []),
    ],
    [audience.knownProperties],
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
