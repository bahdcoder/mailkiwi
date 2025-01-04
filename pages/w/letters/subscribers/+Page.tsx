import { columns, getCommonPinningStyles } from "./components/columns.js"
import * as Table from "./components/table.js"
import "./styles.css"
import * as Dropdown from "@/pages/components/dropdown/dropdown.jsx"
import { CancelIcon } from "@/pages/components/icons/cancel.svg.jsx"
import { CheckIcon } from "@/pages/components/icons/check.svg.jsx"
import { MoreVertIcon } from "@/pages/components/icons/more-vert.svg.jsx"
import { PlusIcon } from "@/pages/components/icons/plus.svg.jsx"
import { SearchIcon } from "@/pages/components/icons/search.svg.jsx"
import {
  FilterCondition,
  FiltersBuilder,
  TextFilterInputForm,
} from "@/pages/w/letters/subscribers/components/filters.jsx"
import { Pagination } from "@/pages/w/letters/subscribers/components/pagination.jsx"
import { Button } from "@kibamail/owly/button"
import { Checkbox } from "@kibamail/owly/checkbox"
import * as Select from "@kibamail/owly/select-field"
import * as Tabs from "@kibamail/owly/tabs"
import { Text } from "@kibamail/owly/text"
import * as TextField from "@kibamail/owly/text-field"
import { useQuery } from "@tanstack/react-query"
import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table"
import cn from "classnames"
import * as React from "react"
import { useDebounce } from "use-debounce"
import { usePageContext } from "vike-react/usePageContext"
import { PageContext } from "vike/types"

import { AllowedFilterField } from "@/audiences/dto/segments/create_segment_dto.js"

import { ContactWithTagsAndProperties, Tag } from "@/database/database_schema_types.js"

import { route } from "@/shared/routes/route_aliases.js"

interface PageProps {
  contacts: { data: ContactWithTagsAndProperties[]; total: number }
}

const filterOperationLabels: Record<string, string> = {
  eq: "Is",
  ne: "Is not",
  contains: "Contains",
  notContains: "Does not contain",
}

type FilterOperationOptions = Record<
  string,
  {
    name: string
    operationLabels?: Record<string, string>
    operations: { label: string; value: FilterCondition["operation"] }[]
    options?: React.FC<{
      pageCtx: PageContext
      children: React.ReactNode
      filter: FilterCondition
      onChange: (value: FilterCondition["value"]) => void
    }>
  }
>
const TextFilterOptions: FilterOperationOptions["string"]["options"] = ({
  children,
  onChange,
  filter,
}) => {
  const [isOpen, setIsOpen] = React.useState(false)

  function onSubmit(value: string) {
    setIsOpen(false)
    onChange(value)
  }

  function onCancel() {
    setIsOpen(false)
  }

  return (
    <Dropdown.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dropdown.Trigger asChild>{children}</Dropdown.Trigger>

      <Dropdown.Content>
        <TextFilterInputForm
          id={filter.field}
          onSubmit={onSubmit}
          onCancel={onCancel}
          defaultValue={filter.value as string}
          label={filterOperationOptions[filter.field].name}
        />
      </Dropdown.Content>
    </Dropdown.Root>
  )
}

const filterOperationOptions: FilterOperationOptions = {
  email: {
    name: "Email address",
    operations: [
      { label: filterOperationLabels["eq"], value: "eq" },
      { label: filterOperationLabels["ne"], value: "ne" },
      { label: filterOperationLabels["contains"], value: "contains" },
      { label: filterOperationLabels["notContains"], value: "notContains" },
    ],
    options: TextFilterOptions,
  },
  firstName: {
    name: "First name",
    operations: [
      { label: filterOperationLabels["eq"], value: "eq" },
      { label: filterOperationLabels["ne"], value: "ne" },
      { label: filterOperationLabels["contains"], value: "contains" },
      { label: filterOperationLabels["notContains"], value: "notContains" },
    ],
    options: TextFilterOptions,
  },
  lastName: {
    name: "Last name",
    operations: [
      { label: filterOperationLabels["eq"], value: "eq" },
      { label: filterOperationLabels["ne"], value: "ne" },
      { label: filterOperationLabels["contains"], value: "contains" },
      { label: filterOperationLabels["notContains"], value: "notContains" },
    ],
    options: TextFilterOptions,
  },
  tags: {
    name: "Tags",
    operations: [
      { label: "Has", value: "contains" },
      { label: "Does not have", value: "notContains" },
    ],
    operationLabels: {
      contains: "Has",
      notContains: "Does not have",
    },
    options({ children, pageCtx, onChange, filter }) {
      function onTagCheckedStatusChanged(state: boolean | "indeterminate", tag: Tag) {
        const newValue =
          state === true
            ? [...(filter.value as string[]), tag.id]
            : (filter.value as string[]).filter((tagId) => tagId !== tag.id)

        onChange(newValue)
      }

      return (
        <Dropdown.Root>
          <Dropdown.Trigger asChild>{children}</Dropdown.Trigger>

          <Dropdown.Content>
            {pageCtx.tags.map((tag) => {
              const id = `w-subscribers-filters-select-tag-update-${tag.id}`

              const isChecked = (filter.value as string[]).some(
                (tagId) => tagId === tag.id,
              )

              return (
                <label
                  key={tag.id}
                  htmlFor={id}
                  className="gap-2 px-2 w-full bg-transparent rounded-lg hover:bg-[var(--background-secondary)] h-8 flex items-center justify-start cursor-pointer"
                >
                  <Checkbox
                    id={id}
                    variant="circle"
                    checked={isChecked}
                    onCheckedChange={(state) => [onTagCheckedStatusChanged(state, tag)]}
                  />
                  <Text className="capitalize">{tag.name}</Text>
                </label>
              )
            })}
          </Dropdown.Content>
        </Dropdown.Root>
      )
    },
  },
}

function SubscribersPage() {
  const [enabled, setEnabled] = React.useState(false)
  const [filters, setFilters] = React.useState<FilterCondition[]>([])
  const [deletedFilters, setDeletedFilters] = React.useState<Record<string, boolean>>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [search, setSearch] = React.useState<string>("")
  const ctx = usePageContext()
  const pageProps = usePageContext().pageProps as PageProps
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

  const { data } = useQuery<{ data: ContactWithTagsAndProperties[]; total: number }>({
    queryKey: ["contacts", debouncedSearch, activeFilters, pagination],
    initialData: { total: pageProps.contacts.total, data: pageProps.contacts.data },
    placeholderData: (previous) => previous,
    async queryFn() {
      const response = await fetch(
        route(
          "contacts_search",
          { audienceId: ctx.letters.audience.id },
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
  })

  React.useEffect(
    function () {
      if (filters.length > 0 || search || pagination.pageIndex > 0) {
        setEnabled(true)
      }
    },
    [filters, pagination.pageIndex, search],
  )

  const table = useReactTable({
    data: data.data,
    columns,
    pageCount: Math.ceil(data.total / pagination.pageSize),
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

  function onFiltersChange(filters: FilterCondition[]) {
    setFilters((current) =>
      filters.map((filter) => {
        const existing = current.find(
          (currentFilter) => currentFilter.field === filter.field,
        )

        return { ...existing, ...filter }
      }),
    )

    table.resetPageIndex()
  }

  function removeFilter(filter: FilterCondition) {
    setDeletedFilters((current) => ({ ...current, [filter.id]: true }))
  }

  function updateFilterOperation(
    filter: FilterCondition,
    operation: FilterCondition["operation"],
  ) {
    setFilters((current) =>
      current.map((f) => (f.id === filter.id ? { ...f, operation } : f)),
    )
  }

  function updateFilterValue(filter: FilterCondition, value: FilterCondition["value"]) {
    setFilters((current) =>
      current.map((f) => (f.id === filter.id ? { ...f, value } : f)),
    )
  }

  const startOfPage = pagination.pageIndex * pagination.pageSize + 1
  const endOfPage = Math.min(
    pagination.pageIndex * pagination.pageSize + pagination.pageSize,
    data.total,
  )

  return (
    <Tabs.Content value="subscribers" className="py-6">
      <div className="w-full flex flex-col gap-y-2 lg:gap-y-0 lg:flex-row items-center lg:justify-between">
        <div className="w-fit gap-2 flex items-center">
          <TextField.Root
            type="search"
            placeholder="Search subscribers"
            className="w-search-subscribers w-72"
            onChange={(event) => {
              setSearch(event.target.value)
            }}
          >
            <TextField.Slot side="left">
              <SearchIcon />
            </TextField.Slot>
          </TextField.Root>

          <FiltersBuilder onFiltersChange={onFiltersChange} />
        </div>

        <div className="w-full lg:w-auto">
          <div className="flex items-center gap-2">
            <Select.Root name="type">
              <Select.Trigger placeholder="Select a segment" className="min-w-52" />
              <Select.Content className="z-[99]">
                <Select.Item value="text">All subscribers</Select.Item>
                <Select.Item value="number">Gmail users</Select.Item>
                <Select.Item value="date">Bought a book</Select.Item>
                <Select.Item value="boolean">Have not bought a book</Select.Item>
              </Select.Content>
            </Select.Root>

            <Button variant="tertiary">
              <MoreVertIcon className="!w-5 !h-5" />
            </Button>
          </div>
        </div>
      </div>

      {activeFilters.length > 0 ? (
        <div className="w-full flex items-start justify-between pt-3 gap-4">
          <div className="flex flex-grow flex-wrap gap-2">
            {activeFilters.map((filter) => {
              const Component = filterOperationOptions[filter.field]?.options

              const filterValue = (
                <button className="kb-reset text-xs border-r border-[var(--border-tertiary)] px-2.5 h-full max-w-48 truncate text-ellipsis">
                  <Text className="text-xs kb-content-secondary font-medium">
                    {Array.isArray(filter.value)
                      ? filter.value.map((value) => tagNames[value] ?? value).join(", ")
                      : (tagNames[filter.value] ?? filter.value)}
                  </Text>
                </button>
              )

              return (
                <div
                  key={filter.id}
                  className="h-7 border border-[var(--border-tertiary)] flex items-center bg-[var(--background-secondary)] shadow-[0px_-2px_0px_0px_var(--black-5)_inset,0px_2px_0px_0px_var(--white-100)_inset] rounded-lg"
                >
                  <span
                    data-testid={`w-subscribers-filters-select-field-trigger-${filter.field}`}
                    className="kb-reset flex h-full items-center capitalize text-xs border-r border-[var(--border-tertiary)] px-2.5"
                  >
                    <Text className="text-xs kb-content-tertiary">
                      {filterOperationOptions[filter.field].name}
                    </Text>
                  </span>

                  <Dropdown.Root>
                    <Dropdown.Trigger asChild>
                      <button
                        data-testid={`w-subscribers-filters-select-operation-trigger-${filter.field}`}
                        className="kb-reset text-xs cursor-pointer border-r border-[var(--border-tertiary)] hover:bg-[var(--background-hover)] transition ease-linear px-2.5 h-full"
                      >
                        <Text className="text-xs kb-content-tertiary lowercase">
                          {filterOperationLabels[filter.operation]}
                        </Text>
                      </button>
                    </Dropdown.Trigger>

                    <Dropdown.Content
                      data-testid={`w-subscribers-filters-select-operation-content-${filter.field}`}
                    >
                      {filterOperationOptions[filter.field].operations.map((option) => (
                        <Dropdown.Item asChild key={option.value}>
                          <Button
                            variant="tertiary"
                            onClick={() => updateFilterOperation(filter, option.value)}
                            data-testid={`w-subscribers-filters-select-operation-${option.value}`}
                            className="w-full flex items-center h-9 justify-between px-3 cursor-pointer"
                          >
                            <Text className="text-sm">
                              {filterOperationOptions[filter.field].operationLabels?.[
                                option.value
                              ] || option.label}
                            </Text>

                            {filter.operation === option.value && (
                              <CheckIcon className="w-4 h-4 kb-content-tertiary" />
                            )}
                          </Button>
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Content>
                  </Dropdown.Root>

                  {Component ? (
                    <Component
                      pageCtx={ctx}
                      filter={filter}
                      onChange={(value) => updateFilterValue(filter, value)}
                    >
                      {filterValue}
                    </Component>
                  ) : (
                    filterValue
                  )}

                  <button
                    onClick={() => removeFilter(filter)}
                    data-testid={`w-subscribers-filters-select-remove-filter-${filter.field}`}
                    className="px-2.5 cursor-pointer hover:bg-[var(--background-hover)] transition ease-linear h-full rounded-r-lg"
                  >
                    <CancelIcon className="w-4 h-4 kb-content-tertiary" />
                  </button>
                </div>
              )
            })}
          </div>

          <div className="flex-shrink-0">
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                className="py-1 text-xs"
                data-testid="w-subscribers-filters-save-as-segment"
              >
                Save filter as a segment
              </Button>
              <Button
                variant="tertiary"
                className="py-1 text-xs"
                data-testid="w-subscribers-filters-clear"
              >
                Clear filters
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-4 border-t border-b border-[var(--black-5)] h-12 box-border pl-6 flex items-center justify-between">
        <Text className="kb-content-tertiary" data-testid="w-subscribers-filters-showing">
          Showing {startOfPage}-{endOfPage} of {data.total} contacts
        </Text>

        <Button
          variant="tertiary"
          data-testid="w-subscribers-filters-new-subscriber-property"
        >
          <PlusIcon className="!w-5 !h-5" />
          New subscriber property
        </Button>
      </div>

      <div className="w-full max-w-[calc(100vw-var(--w-sidebar-width)-64px)] overflow-x-auto block border-r kb-border-tertiary">
        <Table.Root className="min-w-full">
          <Table.Header>
            {table.getHeaderGroups().map((headerGroup) => (
              <Table.Row key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <Table.Cell
                    style={{
                      ...header.column.columnDef.meta?.style,
                      ...getCommonPinningStyles(header.column),
                    }}
                    key={header.id}
                    className={cn(header.column.columnDef.meta?.header?.className)}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </Table.Cell>
                ))}
              </Table.Row>
            ))}
          </Table.Header>
          <Table.Body>
            {table.getRowModel().rows.map((row) => (
              <Table.Row key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <Table.Cell
                    style={{
                      ...cell.column.columnDef.meta?.style,
                      ...getCommonPinningStyles(cell.column),
                    }}
                    key={cell.id}
                    className={cell.column.columnDef.meta?.cell?.className}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Table.Cell>
                ))}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </div>

      <div className="sticky bottom-0 kb-background-secondary z-[40] py-2">
        <Pagination table={table} />
      </div>
    </Tabs.Content>
  )
}
export { SubscribersPage as Page }
