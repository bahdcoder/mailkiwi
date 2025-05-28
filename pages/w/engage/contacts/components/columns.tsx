import { LabelIcon } from '#root/pages/components/icons/label.svg.jsx'
import { PlusIcon } from '#root/pages/components/icons/plus.svg.jsx'
import { Button } from '@kibamail/owly/button'
import { Checkbox } from '@kibamail/owly/checkbox'
import { Text } from '@kibamail/owly/text'
import { type Column, type RowData, createColumnHelper } from '@tanstack/react-table'
import cn from 'classnames'
import type * as React from 'react'

import type { ContactWithTagsAndProperties } from '#root/database/database_schema_types.js'

export const columnHelper = createColumnHelper<ContactWithTagsAndProperties>()

export function getCommonPinningStyles(
  column: Column<ContactWithTagsAndProperties>,
): React.CSSProperties {
  const isPinned = column.getIsPinned()

  return {
    boxShadow: isPinned ? '-4px 0 4px -4px var(--border-tertiary) inset' : undefined,
    left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
    right: isPinned === 'right' ? `${column.getAfter('right')}px` : undefined,
    position: isPinned ? 'sticky' : 'relative',
    width: column.getSize(),
    zIndex: isPinned ? 1 : 0,
  }
}

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    header?: {
      className?: string
    }
    cell?: {
      className?: string
    }
    style?: React.CSSProperties
  }
}

export const columns = [
  columnHelper.accessor('email', {
    cell: (info) => {
      function onCheckboxChange(state: boolean | 'indeterminate') {
        info.row.getToggleSelectedHandler()({
          target: {
            checked: state === true,
          },
        })
      }

      return (
        <div className="flex items-center gap-2">
          <Checkbox
            size="sm"
            onCheckedChange={onCheckboxChange}
            checked={info.row.getIsSelected()}
            disabled={!info.row.getCanSelect()}
          />
          <Text>{info.getValue()}</Text>
        </div>
      )
    },
    footer: (info) => info.column.id,
    header: ({ table }) => {
      function onCheckboxChange(state: boolean | 'indeterminate') {
        table.getToggleAllRowsSelectedHandler()({
          target: {
            checked: state === true,
          },
        })
      }

      return (
        <div className="flex items-center gap-2">
          <Checkbox
            size="sm"
            onCheckedChange={onCheckboxChange}
            checked={
              table.getIsSomeRowsSelected()
                ? 'indeterminate'
                : table.getIsAllRowsSelected()
            }
          />
          <Text>Email</Text>
        </div>
      )
    },
    meta: {
      style: {
        width: '268px',
        minWidth: '268px',
      },
    },
  }),

  columnHelper.accessor('tags', {
    cell: (info) => {
      const tags = info.getValue()
      return (
        <div className="w-full flex items-center gap-2 overflow-x-auto h-full">
          {info.getValue().length === 0 ? (
            <Text className="kb-content-tertiary">No tags</Text>
          ) : (
            tags.map((tag, idx) => (
              <Button
                asChild
                variant="secondary"
                className={cn('shrink-0 pointer-events-none', {
                  'mr-4': idx === tags.length - 1,
                })}
                size="sm"
                key={tag.id}
              >
                <span>{tag.name}</span>
              </Button>
            ))
          )}
        </div>
      )
    },
    footer: (info) => info.column.id,
    header: () => (
      <div className="flex items-center justify-between">
        <div className="flex gap-1 items-center">
          <LabelIcon className="kb-content-tertiary" />
          <Text>Tags</Text>
        </div>

        <Button variant="tertiary" size="sm">
          <PlusIcon className="w-4 h-4" />
        </Button>
      </div>
    ),
    meta: {
      header: {
        className: 'bg-(--background-hover)!',
      },
      cell: {
        className: 'bg-(--background-hover)! pr-0',
      },
      style: {
        width: '320px',
        minWidth: '320px',
      },
    },
  }),

  columnHelper.accessor('firstName', {
    cell: (info) => <Text className="capitalize">{info.getValue()}</Text>,
    footer: (info) => info.column.id,
    header: () => <Text>First name</Text>,
    meta: {
      style: {
        minWidth: '220px',
      },
    },
  }),
  columnHelper.accessor((row) => row.lastName, {
    id: 'lastName',
    cell: (info) => <Text className="capitalize">{info.getValue()}</Text>,
    footer: (info) => info.column.id,
    header: () => <Text>Last name</Text>,
    meta: {
      style: {
        minWidth: '220px',
      },
    },
  }),
]
