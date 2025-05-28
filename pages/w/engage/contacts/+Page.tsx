import { getCommonPinningStyles } from './components/columns.js'
import * as Table from './components/table.js'
import './styles.css'
import * as Dropdown from '#root/pages/components/dropdown/dropdown.jsx'
import { DisplayedFilterCondition } from '#root/pages/components/filters/displayed-filter-conditions.jsx'
import { CancelIcon } from '#root/pages/components/icons/cancel.svg.jsx'
import { CheckIcon } from '#root/pages/components/icons/check.svg.jsx'
import { SearchIcon } from '#root/pages/components/icons/search.svg.jsx'
import { NewContactProperty } from '#root/pages/w/engage/contacts/components/actions/new_contact_property.jsx'
import { SaveFilterAsSegmentForm } from '#root/pages/w/engage/contacts/components/actions/save_filter_as_segment.jsx'
import { UpdateContactProperty } from '#root/pages/w/engage/contacts/components/actions/update_contact_property.jsx'
import {
  type FilterCondition,
  FiltersBuilder,
  TextFilterInputForm,
} from '#root/pages/w/engage/contacts/components/filters.jsx'
import { Pagination } from '#root/pages/w/engage/contacts/components/pagination.jsx'
import { useContacts } from '#root/pages/w/engage/contacts/hooks/use-contacts.js'
import { useFilterOperations } from '#root/pages/w/engage/contacts/hooks/use-filter-operations.js'
import { Button } from '@kibamail/owly/button'
import { Checkbox } from '@kibamail/owly/checkbox'
import * as Tabs from '@kibamail/owly/tabs'
import { Text } from '@kibamail/owly/text'
import * as TextField from '@kibamail/owly/text-field'
import { flexRender } from '@tanstack/react-table'
import cn from 'classnames'
import * as React from 'react'
import { usePageContext } from 'vike-react/usePageContext'
import type { PageContext } from 'vike/types'

import type { Segment, Tag } from '#root/database/database_schema_types.js'
import { EmptyState } from '#root/pages/components/empty-state/empty_state.jsx'
import { ImportContactsDialog } from '#root/pages/components/flows/contacts/import_contacts/import_contacts_flow.jsx'
import { formatCount } from '#root/pages/utils/number_formatter.js'
import {
  type PageContextWithPageProps,
  usePageContextWithProps,
} from '#root/pages/hooks/use_page_props.js'
import { DefaultPageContext } from '#root/pages/types/page-context.js'

const filterOperationLabels: Record<string, string> = {
  eq: 'Is',
  ne: 'Is not',
  contains: 'Contains',
  notContains: 'Does not contain',
}

type FilterOperationOptions = Record<
  string,
  {
    name: string
    operationLabels?: Record<string, string>
    operations: { label: string; value: FilterCondition['operation'] }[]
    options?: React.FC<{
      pageCtx: PageContextWithPageProps<{ segments: Segment[] }>
      children: React.ReactNode
      filter: FilterCondition
      onChange: (value: FilterCondition['value']) => void
    }>
  }
>
const TextFilterOptions: FilterOperationOptions['string']['options'] = ({
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
    name: 'Email address',
    operations: [
      { label: filterOperationLabels.eq, value: 'eq' },
      { label: filterOperationLabels.ne, value: 'ne' },
      { label: filterOperationLabels.contains, value: 'contains' },
      { label: filterOperationLabels.notContains, value: 'notContains' },
    ],
    options: TextFilterOptions,
  },
  firstName: {
    name: 'First name',
    operations: [
      { label: filterOperationLabels.eq, value: 'eq' },
      { label: filterOperationLabels.ne, value: 'ne' },
      { label: filterOperationLabels.contains, value: 'contains' },
      { label: filterOperationLabels.notContains, value: 'notContains' },
    ],
    options: TextFilterOptions,
  },
  lastName: {
    name: 'Last name',
    operations: [
      { label: filterOperationLabels.eq, value: 'eq' },
      { label: filterOperationLabels.ne, value: 'ne' },
      { label: filterOperationLabels.contains, value: 'contains' },
      { label: filterOperationLabels.notContains, value: 'notContains' },
    ],
    options: TextFilterOptions,
  },
  segmentId: {
    name: 'Segment',
    operations: [
      { label: 'Is in', value: 'eq' },
      { label: 'Is not in', value: 'ne' },
    ],
    options({ pageCtx, filter }) {
      const segments = pageCtx.pageProps?.segments as Segment[]

      const selectedSegment = segments.find((segment) => segment.id === filter.value)

      return (
        <Dropdown.Root>
          <Dropdown.Trigger asChild>
            <button
              type="button"
              className="gap-4 box-border px-2 w-full bg-transparent rounded-lg hover:bg-(--background-secondary) flex items-center justify-between cursor-pointer"
            >
              <Text className="text-xs">{selectedSegment?.name}</Text>
            </button>
          </Dropdown.Trigger>

          <Dropdown.Content className="p-1" sideOffset={12}>
            {segments.map((segment) => (
              <Dropdown.Item
                key={segment.id}
                className="flex items-center gap-2 px-2 py-2 cursor-pointer hover:bg-(--background-hover) rounded-lg"
              >
                <Text className="kb-content-tertiary">{segment.name}</Text>

                <CheckIcon className="w-4 h-4 kb-content-tertiary" />
              </Dropdown.Item>
            ))}
          </Dropdown.Content>
        </Dropdown.Root>
      )
    },
  },
  tags: {
    name: 'Tags',
    operations: [
      { label: 'Has', value: 'contains' },
      { label: 'Does not have', value: 'notContains' },
    ],
    operationLabels: {
      contains: 'Has',
      notContains: 'Does not have',
    },
    options({ children, pageCtx, onChange, filter }) {
      function onTagCheckedStatusChanged(state: boolean | 'indeterminate', tag: Tag) {
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
              const id = `w-contacts-filters-select-tag-update-${tag.id}`

              const isChecked = (filter.value as string[]).some(
                (tagId) => tagId === tag.id,
              )

              return (
                <label
                  key={tag.id}
                  htmlFor={id}
                  className="gap-2 px-2 w-full bg-transparent rounded-lg hover:bg-(--background-secondary) h-8 flex items-center justify-start cursor-pointer"
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

function ContactsPage() {
  const { audience } = usePageContextWithProps()
  const {
    table,
    onClearFilters,
    setFilters,
    setDeletedFilters,
    setSearch,
    pagination,
    data,
    activeFilters,
    filterGroups,
    isEditingProperty,
    setIsEditingProperty,
  } = useContacts()

  const { onFiltersChange, removeFilter, updateFilterOperation, updateFilterValue } =
    useFilterOperations({ setFilters, setDeletedFilters, table })

  const startOfPage = pagination.pageIndex * pagination.pageSize + 1
  const endOfPage = Math.min(
    pagination.pageIndex * pagination.pageSize + pagination.pageSize,
    data?.total ?? 0,
  )

  const noContacts = data?.total === 0

  if (noContacts) {
    return (
      <EmptyState
        title="No contacts yet"
        description="You may import all your contacts in a CSV file."
      >
        <ImportContactsDialog audienceId={audience.id}>
          <Button>Import contacts</Button>
        </ImportContactsDialog>
      </EmptyState>
    )
  }

  return (
    <Tabs.Content value="contacts" className="py-6">
      <UpdateContactProperty
        property={isEditingProperty}
        setProperty={setIsEditingProperty}
      />
      <div className="w-full flex flex-col gap-y-2 lg:gap-y-0 lg:flex-row items-center lg:justify-between">
        <div className="w-fit gap-2 flex items-center">
          <TextField.Root
            type="search"
            placeholder="Search contacts"
            className="w-search-contacts w-72"
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
      </div>

      {activeFilters.length > 0 ? (
        <div className="w-full flex items-start justify-between pt-3 gap-4">
          <div className="flex grow flex-wrap gap-2">
            <DisplayedFilterCondition
              readOnly={false}
              filters={activeFilters}
              removeFilter={removeFilter}
              updateFilterValue={updateFilterValue}
              updateFilterOperation={updateFilterOperation}
            />
          </div>

          <div className="shrink-0">
            <div className="flex items-center gap-2">
              <SaveFilterAsSegmentForm filterGroups={filterGroups}>
                <Button
                  variant="secondary"
                  className="py-1 text-xs"
                  data-testid="w-contacts-filters-save-as-segment"
                >
                  Save filter as a segment
                </Button>
              </SaveFilterAsSegmentForm>
              <Button
                variant="tertiary"
                className="py-1 text-xs"
                data-testid="w-contacts-filters-clear"
                onClick={onClearFilters}
              >
                Clear filters
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-4 border-t border-b border-(--black-5) h-12 box-border pl-6 flex items-center justify-between">
        <Text className="kb-content-tertiary" data-testid="w-contacts-filters-showing">
          Showing {startOfPage}-{endOfPage} of {formatCount(data?.total ?? 0)} contacts
        </Text>

        <NewContactProperty />
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

      <div className="sticky bottom-0 kb-background-secondary z-2 py-2">
        <Pagination table={table} />
      </div>
    </Tabs.Content>
  )
}
export { ContactsPage as Page }
