import * as Dropdown from '#root/pages/components/dropdown/dropdown.jsx'
import { FilterListIcon } from '#root/pages/components/icons/filter-list.svg.jsx'
import { Button } from '@kibamail/owly/button'
import { Checkbox } from '@kibamail/owly/checkbox'
import { Text } from '@kibamail/owly/text'
import * as TextField from '@kibamail/owly/text-field'
import { createContext } from '@radix-ui/react-context'
import cn from 'classnames'
import * as React from 'react'
import { usePageContext } from 'vike-react/usePageContext'
import type { PageContext } from 'vike/types'

import type {
  AllowedFilterField,
  CreateSegmentDto,
} from '#root/core/audiences/dto/segments/create_segment_dto.js'

import type { Segment, Tag } from '#root/database/database_schema_types.js'
import {
  type PageContextWithPageProps,
  usePageContextWithProps,
} from '#root/pages/hooks/use_page_props.js'

export type FilterCondition =
  CreateSegmentDto['filterGroups']['groups'][number]['conditions'][number] & {
    id: string
  }

type FiltersBuilderCtx = {
  filterBuilderOpen: boolean
  setFilterBuilderOpen: React.Dispatch<React.SetStateAction<boolean>>
  filterConditions: FilterCondition[]
  setFilterConditions: React.Dispatch<React.SetStateAction<FilterCondition[]>>
}
const [FiltersBuilderProvider, useFiltersBuilder] = createContext<FiltersBuilderCtx>(
  'ContactsFiltersBuilder',
)

type FilterDefinition = {
  name: string
  disabled?: boolean
  id: AllowedFilterField
  options: React.FC<{ pageCtx: PageContextWithPageProps<{ segments: Segment[] }> }>
}

const fields: FilterDefinition[] = [
  {
    id: 'tags',
    name: 'Tags',
    options: ({ pageCtx: { tags } }) => {
      const { setFilterConditions } = useFiltersBuilder('ContactsFiltersBuilderTags')

      const [id] = React.useState(() => Math.random().toString(36).slice(2))

      function onTagCheckedStatusChanged(state: boolean | 'indeterminate', tag: Tag) {
        setFilterConditions((conditions) => {
          const existingCondition = conditions.find((condition) => condition.id === id)

          if (!existingCondition) {
            return [
              ...conditions,
              {
                id,
                field: 'tags',
                operation: 'contains',
                value: [tag.id],
              } as FilterCondition,
            ]
          }

          return conditions.map((condition) => {
            if (condition.id !== id) {
              return condition
            }

            return {
              ...condition,
              value:
                state === true
                  ? [...(condition.value as string[]), tag.id]
                  : (condition.value as string[]).filter((tagId) => tagId !== tag.id),
            }
          })
        })
      }

      return (
        <div className="flex flex-col gap-1">
          {tags.map((tag) => {
            const id = `w-contacts-filters-select-tag-${tag.id}`

            return (
              <label
                key={tag.id}
                htmlFor={id}
                className="gap-2 px-2 w-full bg-transparent rounded-lg hover:bg-(--background-secondary) h-8 flex items-center justify-start cursor-pointer"
              >
                <Checkbox
                  id={id}
                  variant="circle"
                  onCheckedChange={(state) => [onTagCheckedStatusChanged(state, tag)]}
                />
                <Text className="capitalize">{tag.name}</Text>
              </label>
            )
          })}
        </div>
      )
    },
  },
  {
    id: 'segmentId',
    name: 'Segments',
    options({ pageCtx }) {
      const { setFilterBuilderOpen, setFilterConditions } = useFiltersBuilder(
        'ContactsFiltersBuilderTags',
      )

      const { segments } = pageCtx.pageProps

      function onSegmentSelected(segment: Segment) {
        setFilterBuilderOpen(false)
        setFilterConditions((conditions) => {
          const existingCondition = conditions.find(
            (condition) => condition.field === 'segmentId',
          )

          if (existingCondition) {
            return conditions.map((condition) => {
              if (condition.field !== 'segmentId') {
                return condition
              }

              return {
                ...condition,
                value: segment.id,
              }
            })
          }

          return [
            ...conditions,
            {
              id: 'segmentId',
              operation: 'eq',
              field: 'segmentId',
              value: segment.id,
            } satisfies FilterCondition,
          ]
        })
      }

      return (
        <div className="flex flex-col gap-1">
          {segments.map((segment) => {
            const id = `w-contacts-filters-select-segment-${segment.id}`

            return (
              <button
                type="button"
                id={id}
                key={segment.id}
                onClick={() => onSegmentSelected(segment)}
                className="gap-4 px-2 w-full bg-transparent rounded-lg hover:bg-(--background-secondary) h-8 flex items-center justify-between cursor-pointer"
              >
                <Text className="">{segment.name}</Text>
              </button>
            )
          })}
        </div>
      )
    },
  },
  {
    name: 'Status',
    id: 'status',
    options: () => <div>Status</div>,
    disabled: true,
  },
  {
    name: 'Source',
    id: 'source',
    options: () => <div>Source</div>,
    disabled: true,
  },
  {
    name: 'Date subscribed',
    id: 'subscribedAt',
    options: () => <div>Date subscribed</div>,
    disabled: true,
  },
]

const activity: FilterDefinition[] = [
  {
    name: 'Contact activity',
    id: 'lastTrackedActivityUsingDevice',
    options: () => <div>Contact activity</div>,
    disabled: true,
  },
]

interface TextFilterInputProps {
  id: AllowedFilterField
  label: string
}

function TextFilterInput({ id, label }: TextFilterInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  const { setFilterBuilderOpen, setFilterConditions } =
    useFiltersBuilder('TextFilterInput')

  function onFormSubmit(value: string) {
    setFilterBuilderOpen(false)

    setFilterConditions((conditions) => {
      return [
        ...conditions,
        {
          id: Math.random().toString(36).slice(2),
          value,
          field: id,
          operation: 'contains',
        } satisfies FilterCondition,
      ]
    })
  }

  return <TextFilterInputForm onSubmit={onFormSubmit} id={id} label={label} />
}

export interface TextFilterInputFormProps extends TextFilterInputProps {
  defaultValue?: string
  onSubmit: (value: string) => void
  onCancel?: () => void
}

export function TextFilterInputForm({
  onSubmit,
  defaultValue,
  id,
  label,
  onCancel,
}: TextFilterInputFormProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  function onFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const value = inputRef.current?.value

    if (!value) {
      return
    }

    onSubmit?.(value)
  }

  return (
    <form className="flex flex-col min-w-80" onSubmit={onFormSubmit}>
      <div className="w-full p-4">
        <TextField.Root
          ref={inputRef}
          placeholder="Enter value"
          autoFocus
          defaultValue={defaultValue}
          data-testid={`w-contacts-filters-builder-input-${id}`}
        >
          <TextField.Label>Value</TextField.Label>
        </TextField.Root>
      </div>

      <div className="p-2 flex justify-end gap-2 border-t border-(--border-tertiary) -mx-1">
        <Button
          type="button"
          variant="tertiary"
          className="h-9"
          onClick={onCancel}
          data-testid={`w-contacts-filters-builder-input-cancel-${id}`}
        >
          <Text>Cancel</Text>
        </Button>

        <Button
          type="submit"
          variant="primary"
          className="h-9"
          data-testid={`w-contacts-filters-builder-input-add-${id}`}
        >
          <Text>{defaultValue ? 'Update' : 'Add'}</Text>
        </Button>
      </div>
    </form>
  )
}

const properties: FilterDefinition[] = [
  {
    name: 'Email address',
    id: 'email',
    options() {
      return <TextFilterInput id="email" label="Email address" />
    },
  },
  {
    name: 'First name',
    id: 'firstName',
    options() {
      return <TextFilterInput id="firstName" label="First name" />
    },
  },
  {
    name: 'Last name',
    id: 'lastName',
    options() {
      return <TextFilterInput id="lastName" label="Last name" />
    },
  },
]

function FiltersBuilder() {
  const [selectedFilter, setSelectedFilter] = React.useState<string | undefined>(
    undefined,
  )

  const filterDefinitions = React.useMemo(() => {
    return [...fields, ...activity, ...properties].reduce(
      (acc, field) => {
        acc[field.id] = field
        return acc
      },
      {} as Record<string, FilterDefinition>,
    )
  }, [])

  const ctx = usePageContextWithProps<{ segments: Segment[] }>()

  const { filterBuilderOpen, setFilterBuilderOpen } = useFiltersBuilder(
    'ContactsFiltersBuilder',
  )

  function onFilterSelected(event: Event, filter: FilterDefinition) {
    event.preventDefault()

    setSelectedFilter(filter.id)
  }

  const clearDropdownContent = React.useCallback(() => {
    setTimeout(() => {
      setSelectedFilter(undefined)
    }, 250)
  }, [])

  React.useEffect(() => {
    if (!filterBuilderOpen) {
      clearDropdownContent()
    }
  }, [filterBuilderOpen, clearDropdownContent])

  function onOpenChange(open: boolean) {
    if (!open) {
      clearDropdownContent()
    }

    setFilterBuilderOpen(open)
  }

  const Component = selectedFilter ? filterDefinitions[selectedFilter]?.options : null

  return (
    <Dropdown.Root open={filterBuilderOpen} onOpenChange={onOpenChange}>
      <Dropdown.Trigger asChild>
        <Button
          variant="secondary"
          className="shrink-0 w-contacts-filter-button"
          data-testid="w-contacts-filters-builder-trigger"
        >
          <FilterListIcon />
          Add a filter
        </Button>
      </Dropdown.Trigger>

      <Dropdown.Content>
        {Component ? (
          <Component pageCtx={ctx} />
        ) : (
          <>
            {[fields, activity, properties].map((group, idx) => {
              return (
                <React.Fragment key={`filter-group-${group[0]?.name || idx}`}>
                  {group.map((field) => (
                    <Dropdown.Item
                      key={field.name}
                      className={cn(
                        'w-full bg-transparent rounded-lg px-2 cursor-pointer hover:bg-(--background-secondary) h-8 flex items-center justify-start',
                      )}
                      asChild
                      onSelect={(event) => onFilterSelected(event, field)}
                    >
                      <Button
                        variant="tertiary"
                        disabled={field.disabled}
                        data-testid={`w-contacts-filters-builder-item-${field.name}`}
                      >
                        <Text>{field.name}</Text>
                      </Button>
                    </Dropdown.Item>
                  ))}
                  {idx < 2 && <Dropdown.Separator className="my-1 h-px bg-(--black-5)" />}
                </React.Fragment>
              )
            })}
          </>
        )}
      </Dropdown.Content>
    </Dropdown.Root>
  )
}

interface FiltersBuilderContainerProps {
  onFiltersChange?: (filters: FilterCondition[]) => void
}

function FiltersBuilderContainer({ onFiltersChange }: FiltersBuilderContainerProps) {
  const [filterBuilderOpen, setFilterBuilderOpen] = React.useState(false)
  const [filterConditions, setFilterConditions] = React.useState<FilterCondition[]>([])

  const validConditions = React.useMemo(
    () =>
      filterConditions.filter(
        (condition) => condition.field && condition.operation && condition.value,
      ),
    [filterConditions],
  )

  React.useEffect(() => {
    onFiltersChange?.(validConditions)
  }, [validConditions, onFiltersChange])

  return (
    <FiltersBuilderProvider
      filterConditions={filterConditions}
      filterBuilderOpen={filterBuilderOpen}
      setFilterConditions={setFilterConditions}
      setFilterBuilderOpen={setFilterBuilderOpen}
    >
      <FiltersBuilder />
    </FiltersBuilderProvider>
  )
}

export { FiltersBuilderContainer as FiltersBuilder }
