import * as Dropdown from "@/pages/components/dropdown/dropdown.jsx"
import { CancelIcon } from "@/pages/components/icons/cancel.svg.jsx"
import { CheckIcon } from "@/pages/components/icons/check.svg.jsx"
import { SearchIcon } from "@/pages/components/icons/search.svg.jsx"
import { NewContactProperty } from "@/pages/w/engage/contacts/components/actions/new_contact_property.jsx"
import { SaveFilterAsSegmentForm } from "@/pages/w/engage/contacts/components/actions/save_filter_as_segment.jsx"
import { UpdateContactProperty } from "@/pages/w/engage/contacts/components/actions/update_contact_property.jsx"
import { FilterCondition } from "@/pages/w/engage/contacts/components/filters.jsx"
import { TextFilterInputForm } from "@/pages/w/engage/contacts/components/filters.jsx"
import { Pagination } from "@/pages/w/engage/contacts/components/pagination.jsx"
import { useContacts } from "@/pages/w/engage/contacts/hooks/use-contacts.js"
import { useFilterOperations } from "@/pages/w/engage/contacts/hooks/use-filter-operations.js"
import { Button } from "@kibamail/owly/button"
import { Checkbox } from "@kibamail/owly/checkbox"
import * as Tabs from "@kibamail/owly/tabs"
import { Text } from "@kibamail/owly/text"
import * as TextField from "@kibamail/owly/text-field"
import { flexRender } from "@tanstack/react-table"
import cn from "classnames"
import * as React from "react"
import { usePageContext } from "vike-react/usePageContext"
import { PageContext } from "vike/types"

import {
  ContactWithTagsAndProperties,
  Segment,
  Tag,
} from "@/database/database_schema_types.js"

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
  segmentId: {
    name: "Segment",
    operations: [
      { label: "Is in", value: "eq" },
      { label: "Is not in", value: "ne" },
    ],
    options({ pageCtx, children, onChange, filter }) {
      const segments = pageCtx.pageProps?.segments as Segment[]

      const selectedSegment = segments.find((segment) => segment.id === filter.value)

      return (
        <Dropdown.Root>
          <Dropdown.Trigger asChild>
            <button className="gap-4 box-border px-2 w-full bg-transparent rounded-lg hover:bg-[var(--background-secondary)] flex items-center justify-between cursor-pointer">
              <Text className="text-xs">{selectedSegment?.name}</Text>
            </button>
          </Dropdown.Trigger>

          <Dropdown.Content className="p-1" sideOffset={12}>
            {segments.map((segment) => (
              <Dropdown.Item
                key={segment.id}
                className="flex items-center gap-2 px-2 py-2 cursor-pointer hover:bg-[var(--background-hover)] rounded-lg"
                onSelect={console.log}
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
              const id = `w-contacts-filters-select-tag-update-${tag.id}`

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

interface DisplayedFilterConditionProps {
  filters: FilterCondition[]
  updateFilterValue?: (
    filter: FilterCondition,
    value: string | number | string[] | number[],
  ) => void
  removeFilter?: (filter: FilterCondition) => void
  updateFilterOperation?: (
    filter: FilterCondition,
    operation: FilterCondition["operation"],
  ) => void
  readOnly?: boolean
}

export function DisplayedFilterCondition({
  readOnly = false,
  filters,
  removeFilter,
  updateFilterValue,
  updateFilterOperation,
}: DisplayedFilterConditionProps) {
  const ctx = usePageContext()

  const tagNames = React.useMemo(() => {
    return (
      ctx.tags?.reduce(
        (acc, tag) => {
          acc[tag.id] = tag.name
          return acc
        },
        {} as Record<string, string>,
      ) ?? []
    )
  }, [ctx.tags])

  if (filters.length === 0) {
    return null
  }

  return (
    <>
      {filters.map((filter) => {
        const Component = filterOperationOptions[filter.field]?.options

        const filterValue = (
          <button
            className="kb-reset text-xs border-r border-[var(--border-tertiary)] px-2.5 h-full max-w-48 truncate text-ellipsis"
            key={`${filter.value}-${filter.field}`}
          >
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
              data-testid={`w-contacts-filters-select-field-trigger-${filter.field}`}
              className="kb-reset flex h-full items-center capitalize text-xs border-r border-[var(--border-tertiary)] px-2.5"
            >
              <Text className="text-xs kb-content-tertiary">
                {filterOperationOptions[filter.field].name}
              </Text>
            </span>

            <Dropdown.Root>
              <Dropdown.Trigger asChild>
                <button
                  data-testid={`w-contacts-filters-select-operation-trigger-${filter.field}`}
                  className="kb-reset text-xs cursor-pointer border-r border-[var(--border-tertiary)] hover:bg-[var(--background-hover)] transition ease-linear px-2.5 h-full flex-shrink-0"
                >
                  <Text className="text-xs kb-content-tertiary lowercase">
                    {filterOperationLabels[filter.operation]}
                  </Text>
                </button>
              </Dropdown.Trigger>

              <Dropdown.Content
                data-testid={`w-contacts-filters-select-operation-content-${filter.field}`}
                className="flex-shrink-0"
              >
                {filterOperationOptions[filter.field].operations.map((option) => (
                  <Dropdown.Item asChild key={`${option.value}-${option.label}`}>
                    <Button
                      variant="tertiary"
                      onClick={() =>
                        readOnly
                          ? undefined
                          : updateFilterOperation?.(filter, option.value)
                      }
                      data-testid={`w-contacts-filters-select-operation-${option.value}`}
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
                onChange={(value) =>
                  readOnly ? undefined : updateFilterValue?.(filter, value)
                }
              >
                {filterValue}
              </Component>
            ) : (
              filterValue
            )}

            {readOnly ? null : (
              <button
                onClick={() => removeFilter?.(filter)}
                data-testid={`w-contacts-filters-select-remove-filter-${filter.field}`}
                className="px-2.5 cursor-pointer hover:bg-[var(--background-hover)] transition ease-linear h-full rounded-r-lg"
              >
                <CancelIcon className="w-4 h-4 kb-content-tertiary" />
              </button>
            )}
          </div>
        )
      })}
    </>
  )
}
